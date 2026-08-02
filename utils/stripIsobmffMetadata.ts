import { readUint32BE, readUint64BE } from "./binary";

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/** Reads one ISOBMFF box header at `offset`, handling the 64-bit `largesize`
 * (size===1) and "extends to end of range" (size===0) forms. */
function readBoxBounds(
  bytes: Uint8Array,
  offset: number,
  rangeEnd: number,
): { type: string; headerLength: number; boxEnd: number } | null {
  if (offset + 8 > rangeEnd) return null;
  const size32 = readUint32BE(bytes, offset);
  const type = fourCC(bytes, offset + 4);
  let headerLength = 8;
  let boxEnd: number;

  if (size32 === 1) {
    if (offset + 16 > rangeEnd) return null;
    const largesize = readUint64BE(bytes, offset + 8);
    if (largesize === null) return null;
    headerLength = 16;
    boxEnd = offset + largesize;
  } else if (size32 === 0) {
    boxEnd = rangeEnd;
  } else {
    boxEnd = offset + size32;
  }

  if (boxEnd > rangeEnd || boxEnd <= offset) return null;
  return { type, headerLength, boxEnd };
}

/** Zeros the creation/modification timestamp fields of an `mvhd`/`tkhd`/`mdhd`
 * full-box (immediately after the 4-byte version+flags header): two 4-byte
 * fields for version 0, two 8-byte fields for version 1. Everything else in
 * the box (duration, rate, matrix, track ID, timescale) is left untouched. */
function zeroIsobmffTimestamps(bytes: Uint8Array, payloadStart: number, payloadEnd: number): void {
  if (payloadStart + 4 > payloadEnd) return;
  const version = bytes[payloadStart];
  const fieldSize = version === 1 ? 8 : 4;
  const timestampsStart = payloadStart + 4;
  const timestampsEnd = timestampsStart + fieldSize * 2;
  if (timestampsEnd > payloadEnd) return;
  for (let i = timestampsStart; i < timestampsEnd; i++) bytes[i] = 0;
}

/**
 * Recursively walks `moov`/`trak`/`mdia`, zeroing timestamps in the `mvhd`/
 * `tkhd`/`mdhd` box found directly inside each, and neutralizing any `udta`/
 * `meta` box encountered at any level (rewritten to type `free` with the
 * payload zeroed - this is where iTunes-style tags and Apple's
 * `com.apple.quicktime.location.ISO6709` GPS string live). Box sizes are never
 * changed and nothing is ever removed, so `stco`/`co64` chunk-offset tables
 * elsewhere in the file stay valid.
 */
function walkAndNeutralize(bytes: Uint8Array, start: number, end: number, timestampBoxType: string | null): void {
  let offset = start;
  while (offset < end) {
    const box = readBoxBounds(bytes, offset, end);
    if (!box) return;
    const { type, headerLength, boxEnd } = box;

    if (type === "udta" || type === "meta") {
      bytes[offset + 4] = 0x66; // 'f'
      bytes[offset + 5] = 0x72; // 'r'
      bytes[offset + 6] = 0x65; // 'e'
      bytes[offset + 7] = 0x65; // 'e'
      for (let i = offset + headerLength; i < boxEnd; i++) bytes[i] = 0;
    } else if (type === "moov") {
      walkAndNeutralize(bytes, offset + headerLength, boxEnd, "mvhd");
    } else if (type === "trak") {
      walkAndNeutralize(bytes, offset + headerLength, boxEnd, "tkhd");
    } else if (type === "mdia") {
      walkAndNeutralize(bytes, offset + headerLength, boxEnd, "mdhd");
    } else if (timestampBoxType && type === timestampBoxType) {
      zeroIsobmffTimestamps(bytes, offset + headerLength, boxEnd);
    }

    offset = boxEnd;
  }
}

/**
 * Strips privacy-sensitive metadata from an MP4/MOV/M4A file (all share the
 * same ISOBMFF box structure). Returns null if the bytes don't parse as
 * ISOBMFF, or if the file is fragmented (any top-level `moof` box) - full
 * fragmented-MP4 support (`mvex`/`tfhd`/`tfdt`) is out of scope.
 */
export function stripIsobmffBoxes(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 8) return null;

  // Validate top-level structure and check for fragmentation before mutating anything.
  let offset = 0;
  let sawBox = false;
  while (offset < bytes.length) {
    const box = readBoxBounds(bytes, offset, bytes.length);
    if (!box) return null;
    if (box.type === "moof") return null; // fragmented MP4, unsupported
    sawBox = true;
    offset = box.boxEnd;
  }
  if (!sawBox) return null;

  const result = bytes.slice();
  walkAndNeutralize(result, 0, result.length, null);
  return result;
}

export async function stripIsobmffMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripIsobmffBoxes(bytes);
    if (!cleaned) return null;
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("ISOBMFF metadata stripping failed:", err);
    return null;
  }
}
