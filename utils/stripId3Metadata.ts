import { matchesAscii, readSynchsafeUint32, readUint32LE } from "./binary";

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
    const cleaned = stripId3Tags(bytes);
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("MP3 metadata stripping failed:", err);
    return null;
  }
}

/** Raw AAC (ADTS/ADIF) has no native metadata mechanism; this only strips a
 * non-standard leading ID3v2 tag some encoders prepend, and is a true no-op
 * pass-through otherwise. */
export async function stripAacMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripId3Tags(bytes);
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("AAC metadata stripping failed:", err);
    return null;
  }
}
