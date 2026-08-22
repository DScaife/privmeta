import { concatBytes, matchesAscii, readSynchsafeUint32, readUint32LE } from "./binary";

const EMPTY_ID3V24_HEADER = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

function hasLeadingId3(bytes: Uint8Array): boolean {
  return bytes.length >= 10 && matchesAscii(bytes, 0, "ID3");
}

function isMpegAudioFrame(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

/**
 * FFmpeg writes its `Lavc...` encoder identifier into an AAC fill element.
 * Fill elements are ancillary data, but their bit layout must remain intact,
 * so overwrite only the printable identifier bytes and keep the element size
 * and every audio bit at the same offset.
 */
export function stripAacEncoderIdentification(bytes: Uint8Array): Uint8Array {
  const cleaned = bytes.slice();
  let offset = 0;

  // Only inspect the first ADTS frame. Encoder identification is emitted
  // there; scanning audio payloads globally could mistake real audio for text.
  if (cleaned.length < 9 || cleaned[0] !== 0xff || (cleaned[1] & 0xf6) !== 0xf0) return cleaned;
  const protectionAbsent = (cleaned[1] & 0x01) !== 0;
  const headerSize = protectionAbsent ? 7 : 9;
  const frameLength = ((cleaned[3] & 0x03) << 11) | (cleaned[4] << 3) | (cleaned[5] >>> 5);
  if (frameLength < headerSize + 2 || frameLength > cleaned.length) return cleaned;
  offset = headerSize;

  // id_syn_ele == ID_FIL (6), followed by a 4-bit count. The common FFmpeg
  // form uses count=15 and an 8-bit escape count, hence the identifier begins
  // inside this validated fill-element span.
  const firstWord = (cleaned[offset] << 8) | cleaned[offset + 1];
  if ((firstWord >>> 13) !== 6) return cleaned;
  let count = (firstWord >>> 9) & 0x0f;
  let fillHeaderBits = 7;
  if (count === 15) {
    const escapeCount = (firstWord >>> 1) & 0xff;
    if (escapeCount === 0) return cleaned;
    count += escapeCount - 1;
    fillHeaderBits += 8;
  }

  const fillStartBit = offset * 8 + fillHeaderBits;
  const fillEndBit = fillStartBit + count * 8;
  if (fillEndBit > frameLength * 8) return cleaned;

  // Only bytes wholly contained by the fill payload may be changed.
  const firstWholeByte = Math.ceil(fillStartBit / 8);
  const lastWholeByteExclusive = Math.floor(fillEndBit / 8);
  for (let i = firstWholeByte; i + 4 <= lastWholeByteExclusive; i++) {
    const isLibavIdentifier =
      cleaned[i] === 0x4c && // L
      cleaned[i + 1] === 0x61 && // a
      cleaned[i + 2] === 0x76 && // v
      (cleaned[i + 3] === 0x63 || cleaned[i + 3] === 0x66); // c/f
    if (!isLibavIdentifier) continue;

    let end = i + 4;
    while (end < lastWholeByteExclusive && cleaned[end] >= 0x20 && cleaned[end] <= 0x7e) end++;
    cleaned.fill(0, i, end);
    break;
  }

  return cleaned;
}

/**
 * Strips ID3 tags from an MP3/AAC file: a leading ID3v2 tag (`"ID3"`, synchsafe
 * size field), and trailing tags in the order they conventionally stack before
 * EOF - ID3v1 (128 bytes, `"TAG"`), ID3v1 Extended (227 bytes, `"TAG+"`,
 * immediately before a found ID3v1 tag), and an APEv2 footer (32 bytes,
 * `"APETAGEX"`, immediately before whatever ID3v1/Extended tag was found, if
 * any). The audio frames in between are never touched.
 *
 * Never returns null - if any single tag's computed span looks invalid, that
 * tag is left in place (logged) rather than risking truncation of audio data,
 * which would be worse than leaving a stray tag behind. A file with no
 * recognized tags at all is returned byte-identical (true pass-through - this
 * is also how raw .aac, which has no native tagging format, is handled).
 */

export function stripId3Tags(bytes: Uint8Array): Uint8Array {
  let leadingEnd = 0;
  if (bytes.length >= 10 && matchesAscii(bytes, 0, "ID3")) {
    const flags = bytes[5];
    const footerPresent = (flags & 0x10) !== 0;
    const size = readSynchsafeUint32(bytes, 6);
    const span = 10 + size + (footerPresent ? 10 : 0);
    if (span <= bytes.length) {
      leadingEnd = span;
    } else {
      console.error("ID3 stripping: leading ID3v2 tag size exceeds file length, leaving it in place");
    }
  }

  let id3v1Start: number | null = null;
  if (bytes.length - leadingEnd >= 128) {
    const candidate = bytes.length - 128;
    if (matchesAscii(bytes, candidate, "TAG")) id3v1Start = candidate;
  }

  let extStart: number | null = null;
  if (id3v1Start !== null && id3v1Start - leadingEnd >= 227) {
    const candidate = id3v1Start - 227;
    if (matchesAscii(bytes, candidate, "TAG+")) extStart = candidate;
  }

  const beforeId3v1 = extStart ?? id3v1Start ?? bytes.length;

  let apeStart: number | null = null;
  if (beforeId3v1 - leadingEnd >= 32) {
    const footerStart = beforeId3v1 - 32;
    if (matchesAscii(bytes, footerStart, "APETAGEX")) {
      const tagSize = readUint32LE(bytes, footerStart + 12);
      const flags = readUint32LE(bytes, footerStart + 16);
      const hasHeader = (flags & 0x80000000) !== 0;
      const fullSpan = tagSize + (hasHeader ? 32 : 0);
      const start = beforeId3v1 - fullSpan;
      if (start >= leadingEnd && start <= footerStart) {
        apeStart = start;
      } else {
        console.error("ID3 stripping: APEv2 tag size looks invalid, leaving it in place");
      }
    }
  }

  const trailingBoundary = apeStart ?? beforeId3v1;

  if (leadingEnd >= trailingBoundary) return bytes;
  return bytes.subarray(leadingEnd, trailingBoundary);
}

export async function stripMp3Metadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let cleaned = stripId3Tags(bytes);
    // Some validators reject a perfectly decodable raw MPEG stream after its
    // leading ID3 tag is removed. A zero-length ID3v2.4 envelope contains no
    // fields but makes the stream unambiguous to those readers.
    if (hasLeadingId3(bytes) && !hasLeadingId3(cleaned) && isMpegAudioFrame(cleaned)) {
      cleaned = concatBytes([EMPTY_ID3V24_HEADER, cleaned]);
    }
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("MP3 metadata stripping failed:", err);
    return null;
  }
}

/** Raw AAC has no general-purpose native tag container. Strip non-standard
 * ID3/APE tags plus the known Libav encoder identifier carried as ancillary
 * data in an ADTS fill element. */
export async function stripAacMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripAacEncoderIdentification(stripId3Tags(bytes));
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("AAC metadata stripping failed:", err);
    return null;
  }
}
