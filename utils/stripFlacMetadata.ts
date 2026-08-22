import { concatBytes } from "./binary";

// FLAC METADATA_BLOCK_HEADER types (1 byte: bit 7 = last-block flag, bits 6-0 = type)
const BLOCK_STREAMINFO = 0;
const BLOCK_SEEKTABLE = 3;
const BLOCK_CUESHEET = 5;

/**
 * Strips metadata blocks from a FLAC file: keeps STREAMINFO (mandatory, must
 * stay first), SEEKTABLE and CUESHEET (needed for seeking - not "identifying"
 * metadata), and any reserved/unknown block type (kept conservatively). Drops
 * PADDING, APPLICATION, VORBIS_COMMENT and PICTURE (cover art). Audio frames
 * after the metadata block chain are copied verbatim.
 *
 * Whichever kept block ends up last has its last-block-flag bit forced to 1
 * (even if it wasn't originally last), and no earlier kept block keeps that
 * bit set - otherwise a decoder would misread the following audio frame data
 * as another metadata block header.
 */
export function stripFlacBlocks(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 4 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "fLaC") {
    return null;
  }

  const kept: Uint8Array[] = [bytes.subarray(0, 4)];
  const keptHeaderOffsets: number[] = [];
  let outputLength = 4;

  let offset = 4;
  let isFirstBlock = true;

  while (true) {
    if (offset + 4 > bytes.length) return null;
    const headerByte = bytes[offset];
    const isLast = (headerByte & 0x80) !== 0;
    const blockType = headerByte & 0x7f;
    const length = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const blockEnd = offset + 4 + length;
    if (blockEnd > bytes.length) return null;

    if (isFirstBlock) {
      if (blockType !== BLOCK_STREAMINFO) return null;
      isFirstBlock = false;
    }
    if (blockType === 127) return null; // invalid block type

    const keep = blockType === BLOCK_STREAMINFO || blockType === BLOCK_SEEKTABLE || blockType === BLOCK_CUESHEET || blockType >= 7;
    if (keep) {
      keptHeaderOffsets.push(outputLength);
      kept.push(bytes.subarray(offset, blockEnd));
      outputLength += blockEnd - offset;
    }

    offset = blockEnd;
    if (isLast) break;
  }

  kept.push(bytes.subarray(offset)); // audio frames

  const result = concatBytes(kept);

  for (let i = 0; i < keptHeaderOffsets.length; i++) {
    const headerOffset = keptHeaderOffsets[i];
    if (i === keptHeaderOffsets.length - 1) {
      result[headerOffset] |= 0x80;
    } else {
      result[headerOffset] &= 0x7f;
    }
  }

  return result;
}

export async function stripFlacMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripFlacBlocks(bytes);
    if (!cleaned) return null;
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("FLAC metadata stripping failed:", err);
    return null;
  }
}
