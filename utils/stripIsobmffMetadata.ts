import { readUint16BE, readUint32BE, readUint64BE } from "./binary";

type BoxBounds = { type: string; headerLength: number; boxEnd: number };
type LocatedBox = BoxBounds & { offset: number };
type ByteRange = { start: number; end: number };

const METADATA_HANDLER_TYPE = "meta";
const MAX_SAMPLE_TABLE_ENTRIES = 1_000_000;

const TFHD_BASE_DATA_OFFSET_PRESENT = 0x000001;
const TFHD_SAMPLE_DESCRIPTION_INDEX_PRESENT = 0x000002;
const TFHD_DEFAULT_SAMPLE_DURATION_PRESENT = 0x000008;
const TFHD_DEFAULT_SAMPLE_SIZE_PRESENT = 0x000010;
const TFHD_DEFAULT_SAMPLE_FLAGS_PRESENT = 0x000020;
const TFHD_DEFAULT_BASE_IS_MOOF = 0x020000;

const TRUN_DATA_OFFSET_PRESENT = 0x000001;
const TRUN_FIRST_SAMPLE_FLAGS_PRESENT = 0x000004;
const TRUN_SAMPLE_DURATION_PRESENT = 0x000100;
const TRUN_SAMPLE_SIZE_PRESENT = 0x000200;
const TRUN_SAMPLE_FLAGS_PRESENT = 0x000400;
const TRUN_SAMPLE_COMPOSITION_TIME_OFFSET_PRESENT = 0x000800;

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/** Reads one ISOBMFF box header at `offset`, handling the 64-bit `largesize`
 * (size===1) and "extends to end of range" (size===0) forms. */
function readBoxBounds(
  bytes: Uint8Array,
  offset: number,
  rangeEnd: number,
): BoxBounds | null {
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

/** Parses every direct child in a box payload. Failing closed here prevents a
 * malformed sample table from making us zero bytes based on guessed bounds. */
function readChildBoxes(bytes: Uint8Array, start: number, end: number): LocatedBox[] | null {
  const boxes: LocatedBox[] = [];
  let offset = start;
  while (offset < end) {
    const box = readBoxBounds(bytes, offset, end);
    if (!box) return null;
    boxes.push({ ...box, offset });
    offset = box.boxEnd;
  }
  return boxes;
}

function findChild(boxes: LocatedBox[], type: string): LocatedBox | undefined {
  return boxes.find((box) => box.type === type);
}

function payloadStart(box: LocatedBox): number {
  return box.offset + box.headerLength;
}

function readFullBoxFlags(bytes: Uint8Array, offset: number): number {
  return (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
}

function readInt32BE(bytes: Uint8Array, offset: number): number {
  const value = readUint32BE(bytes, offset);
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function neutralizeBox(bytes: Uint8Array, box: LocatedBox): void {
  bytes[box.offset + 4] = 0x66; // 'f'
  bytes[box.offset + 5] = 0x72; // 'r'
  bytes[box.offset + 6] = 0x65; // 'e'
  bytes[box.offset + 7] = 0x65; // 'e'
  bytes.fill(0, payloadStart(box), box.boxEnd);
}

function readSampleSizes(bytes: Uint8Array, box: LocatedBox): number[] | null {
  const start = payloadStart(box);

  if (box.type === "stsz") {
    if (start + 12 > box.boxEnd) return null;
    const fixedSize = readUint32BE(bytes, start + 4);
    const sampleCount = readUint32BE(bytes, start + 8);
    if (sampleCount > MAX_SAMPLE_TABLE_ENTRIES) return null;

    if (fixedSize !== 0) return new Array<number>(sampleCount).fill(fixedSize);
    if (start + 12 + sampleCount * 4 > box.boxEnd) return null;

    const sizes = new Array<number>(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      sizes[i] = readUint32BE(bytes, start + 12 + i * 4);
    }
    return sizes;
  }

  if (box.type === "stz2") {
    if (start + 12 > box.boxEnd) return null;
    const fieldSize = bytes[start + 7];
    const sampleCount = readUint32BE(bytes, start + 8);
    if (sampleCount > MAX_SAMPLE_TABLE_ENTRIES) return null;

    const dataStart = start + 12;
    const dataLength =
      fieldSize === 4
        ? Math.ceil(sampleCount / 2)
        : fieldSize === 8
          ? sampleCount
          : fieldSize === 16
            ? sampleCount * 2
            : -1;
    if (dataLength < 0 || dataStart + dataLength > box.boxEnd) return null;

    const sizes = new Array<number>(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      if (fieldSize === 4) {
        const packed = bytes[dataStart + Math.floor(i / 2)];
        sizes[i] = i % 2 === 0 ? packed >>> 4 : packed & 0x0f;
      } else if (fieldSize === 8) {
        sizes[i] = bytes[dataStart + i];
      } else {
        sizes[i] = readUint16BE(bytes, dataStart + i * 2);
      }
    }
    return sizes;
  }

  return null;
}

function readChunkOffsets(bytes: Uint8Array, box: LocatedBox): number[] | null {
  const start = payloadStart(box);
  if (start + 8 > box.boxEnd) return null;
  const entryCount = readUint32BE(bytes, start + 4);
  if (entryCount > MAX_SAMPLE_TABLE_ENTRIES) return null;

  const entrySize = box.type === "co64" ? 8 : 4;
  if (start + 8 + entryCount * entrySize > box.boxEnd) return null;

  const offsets = new Array<number>(entryCount);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = start + 8 + i * entrySize;
    if (box.type === "co64") {
      const value = readUint64BE(bytes, entryOffset);
      if (value === null) return null;
      offsets[i] = value;
    } else {
      offsets[i] = readUint32BE(bytes, entryOffset);
    }
  }
  return offsets;
}

type SampleToChunkEntry = { firstChunk: number; samplesPerChunk: number };

function readSampleToChunk(bytes: Uint8Array, box: LocatedBox): SampleToChunkEntry[] | null {
  const start = payloadStart(box);
  if (start + 8 > box.boxEnd) return null;
  const entryCount = readUint32BE(bytes, start + 4);
  if (
    entryCount === 0 ||
    entryCount > MAX_SAMPLE_TABLE_ENTRIES ||
    start + 8 + entryCount * 12 > box.boxEnd
  ) {
    return null;
  }

  const entries = new Array<SampleToChunkEntry>(entryCount);
  let previousFirstChunk = 0;
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = start + 8 + i * 12;
    const firstChunk = readUint32BE(bytes, entryOffset);
    const samplesPerChunk = readUint32BE(bytes, entryOffset + 4);
    if (firstChunk <= previousFirstChunk || samplesPerChunk === 0) return null;
    entries[i] = { firstChunk, samplesPerChunk };
    previousFirstChunk = firstChunk;
  }
  if (entries[0].firstChunk !== 1) return null;
  return entries;
}

function isContainedInMediaData(range: ByteRange, mediaDataRanges: ByteRange[]): boolean {
  return mediaDataRanges.some(({ start, end }) => range.start >= start && range.end <= end);
}

/** Resolves a track's stsc/stco(or co64)/stsz(or stz2) tables into exact file
 * ranges for its samples. Chunk offsets are absolute file offsets. */
function resolveSampleRanges(bytes: Uint8Array, stbl: LocatedBox, mediaDataRanges: ByteRange[]): ByteRange[] | null {
  const boxes = readChildBoxes(bytes, payloadStart(stbl), stbl.boxEnd);
  if (!boxes) return null;

  const sizeBox = findChild(boxes, "stsz") ?? findChild(boxes, "stz2");
  const chunkOffsetBox = findChild(boxes, "stco") ?? findChild(boxes, "co64");
  if (!sizeBox || !chunkOffsetBox) return null;

  const sampleSizes = readSampleSizes(bytes, sizeBox);
  const chunkOffsets = readChunkOffsets(bytes, chunkOffsetBox);
  if (!sampleSizes || !chunkOffsets) return null;
  if (sampleSizes.length === 0) return chunkOffsets.length === 0 ? [] : null;

  const sampleToChunkBox = findChild(boxes, "stsc");
  if (!sampleToChunkBox) return null;
  const sampleToChunk = readSampleToChunk(bytes, sampleToChunkBox);
  if (!sampleToChunk) return null;

  const ranges: ByteRange[] = [];
  let sampleIndex = 0;
  let mappingIndex = 0;

  for (let chunkIndex = 1; chunkIndex <= chunkOffsets.length; chunkIndex++) {
    while (mappingIndex + 1 < sampleToChunk.length && sampleToChunk[mappingIndex + 1].firstChunk <= chunkIndex) {
      mappingIndex++;
    }

    let position = chunkOffsets[chunkIndex - 1];
    const samplesPerChunk = sampleToChunk[mappingIndex].samplesPerChunk;
    for (let i = 0; i < samplesPerChunk; i++) {
      if (sampleIndex >= sampleSizes.length) return null;
      const size = sampleSizes[sampleIndex++];
      const end = position + size;
      if (!Number.isSafeInteger(end) || end < position) return null;

      const range = { start: position, end };
      if (size > 0 && !isContainedInMediaData(range, mediaDataRanges)) return null;
      if (size > 0) ranges.push(range);
      position = end;
    }
  }

  return sampleIndex === sampleSizes.length ? ranges : null;
}

type MetadataTrackPlan = {
  track: LocatedBox;
  trackId: number;
  sampleRanges: ByteRange[];
  fragmentBoxes: LocatedBox[];
};

function readTrackId(bytes: Uint8Array, trackChildren: LocatedBox[]): number | null {
  const tkhd = findChild(trackChildren, "tkhd");
  if (!tkhd) return null;
  const start = payloadStart(tkhd);
  if (start + 4 > tkhd.boxEnd) return null;
  const version = bytes[start];
  const trackIdOffset = start + (version === 1 ? 20 : version === 0 ? 12 : -1);
  if (trackIdOffset < start || trackIdOffset + 4 > tkhd.boxEnd) return null;
  const trackId = readUint32BE(bytes, trackIdOffset);
  return trackId === 0 ? null : trackId;
}

/** Returns undefined for a normal audio/video track, null for a malformed or
 * unsupported metadata track, and a removal plan for a `meta` handler track. */
function planMetadataTrackRemoval(
  bytes: Uint8Array,
  track: LocatedBox,
  mediaDataRanges: ByteRange[],
): MetadataTrackPlan | null | undefined {
  const trackChildren = readChildBoxes(bytes, payloadStart(track), track.boxEnd);
  if (!trackChildren) return null;
  const mdia = findChild(trackChildren, "mdia");
  if (!mdia) return undefined;

  const mediaChildren = readChildBoxes(bytes, payloadStart(mdia), mdia.boxEnd);
  if (!mediaChildren) return null;
  const handler = findChild(mediaChildren, "hdlr");
  if (!handler) return null;

  const handlerPayloadStart = payloadStart(handler);
  if (handlerPayloadStart + 12 > handler.boxEnd) return null;
  if (fourCC(bytes, handlerPayloadStart + 8) !== METADATA_HANDLER_TYPE) return undefined;

  const trackId = readTrackId(bytes, trackChildren);
  if (trackId === null) return null;

  const minf = findChild(mediaChildren, "minf");
  if (!minf) return null;
  const mediaInfoChildren = readChildBoxes(bytes, payloadStart(minf), minf.boxEnd);
  if (!mediaInfoChildren) return null;
  const stbl = findChild(mediaInfoChildren, "stbl");
  if (!stbl) return null;

  const sampleRanges = resolveSampleRanges(bytes, stbl, mediaDataRanges);
  return sampleRanges ? { track, trackId, sampleRanges, fragmentBoxes: [] } : null;
}

function collectMetadataTrackPlans(
  bytes: Uint8Array,
  topLevelBoxes: LocatedBox[],
  mediaDataRanges: ByteRange[],
): MetadataTrackPlan[] | null {
  const plans: MetadataTrackPlan[] = [];
  for (const moov of topLevelBoxes.filter((box) => box.type === "moov")) {
    const children = readChildBoxes(bytes, payloadStart(moov), moov.boxEnd);
    if (!children) return null;
    for (const track of children.filter((box) => box.type === "trak")) {
      const plan = planMetadataTrackRemoval(bytes, track, mediaDataRanges);
      if (plan === null) return null;
      if (plan) plans.push(plan);
    }
  }
  return plans;
}

function collectTrexDefaultSampleSizes(bytes: Uint8Array, topLevelBoxes: LocatedBox[]): Map<number, number> | null {
  const defaults = new Map<number, number>();
  for (const moov of topLevelBoxes.filter((box) => box.type === "moov")) {
    const moovChildren = readChildBoxes(bytes, payloadStart(moov), moov.boxEnd);
    if (!moovChildren) return null;
    for (const mvex of moovChildren.filter((box) => box.type === "mvex")) {
      const mvexChildren = readChildBoxes(bytes, payloadStart(mvex), mvex.boxEnd);
      if (!mvexChildren) return null;
      for (const trex of mvexChildren.filter((box) => box.type === "trex")) {
        const start = payloadStart(trex);
        if (start + 24 > trex.boxEnd) return null;
        const trackId = readUint32BE(bytes, start + 4);
        if (trackId === 0 || defaults.has(trackId)) return null;
        defaults.set(trackId, readUint32BE(bytes, start + 16));
      }
    }
  }
  return defaults;
}

type TrackFragmentHeader = {
  trackId: number;
  baseDataOffset: number | null;
  defaultBaseIsMoof: boolean;
  defaultSampleSize: number | null;
};

function readTrackFragmentHeader(bytes: Uint8Array, tfhd: LocatedBox): TrackFragmentHeader | null {
  const start = payloadStart(tfhd);
  if (start + 8 > tfhd.boxEnd) return null;
  const flags = readFullBoxFlags(bytes, start);
  const knownFlags =
    TFHD_BASE_DATA_OFFSET_PRESENT |
    TFHD_SAMPLE_DESCRIPTION_INDEX_PRESENT |
    TFHD_DEFAULT_SAMPLE_DURATION_PRESENT |
    TFHD_DEFAULT_SAMPLE_SIZE_PRESENT |
    TFHD_DEFAULT_SAMPLE_FLAGS_PRESENT |
    0x010000 |
    TFHD_DEFAULT_BASE_IS_MOOF;
  if ((flags & ~knownFlags) !== 0) return null;

  const trackId = readUint32BE(bytes, start + 4);
  if (trackId === 0) return null;
  let cursor = start + 8;
  let baseDataOffset: number | null = null;
  let defaultSampleSize: number | null = null;

  if (flags & TFHD_BASE_DATA_OFFSET_PRESENT) {
    if (cursor + 8 > tfhd.boxEnd) return null;
    baseDataOffset = readUint64BE(bytes, cursor);
    if (baseDataOffset === null) return null;
    cursor += 8;
  }
  if (flags & TFHD_SAMPLE_DESCRIPTION_INDEX_PRESENT) cursor += 4;
  if (flags & TFHD_DEFAULT_SAMPLE_DURATION_PRESENT) cursor += 4;
  if (flags & TFHD_DEFAULT_SAMPLE_SIZE_PRESENT) {
    if (cursor + 4 > tfhd.boxEnd) return null;
    defaultSampleSize = readUint32BE(bytes, cursor);
    cursor += 4;
  }
  if (flags & TFHD_DEFAULT_SAMPLE_FLAGS_PRESENT) cursor += 4;
  if (cursor > tfhd.boxEnd) return null;

  return {
    trackId,
    baseDataOffset,
    defaultBaseIsMoof: Boolean(flags & TFHD_DEFAULT_BASE_IS_MOOF),
    defaultSampleSize,
  };
}

/** Resolves all samples described by a metadata `traf`. The common streaming
 * form is relative to the enclosing `moof`; explicit absolute base offsets are
 * also accepted. Ambiguous multi-track implicit bases fail closed. */
function resolveTrackFragmentRanges(
  bytes: Uint8Array,
  moof: LocatedBox,
  traf: LocatedBox,
  trafCount: number,
  defaultSampleSizeFromTrex: number | undefined,
  mediaDataRanges: ByteRange[],
): { trackId: number; ranges: ByteRange[] } | null {
  const children = readChildBoxes(bytes, payloadStart(traf), traf.boxEnd);
  if (!children) return null;
  const tfhd = findChild(children, "tfhd");
  const truns = children.filter((box) => box.type === "trun");
  if (!tfhd || truns.length === 0) return null;

  const header = readTrackFragmentHeader(bytes, tfhd);
  if (!header) return null;
  const baseDataOffset =
    header.baseDataOffset ??
    (header.defaultBaseIsMoof || trafCount === 1 ? moof.offset : null);
  if (baseDataOffset === null) return null;
  const defaultSampleSize = header.defaultSampleSize ?? defaultSampleSizeFromTrex;

  const ranges: ByteRange[] = [];
  let totalSamples = 0;
  let previousRunEnd: number | null = null;
  for (const trun of truns) {
    const start = payloadStart(trun);
    if (start + 8 > trun.boxEnd) return null;
    const flags = readFullBoxFlags(bytes, start);
    const knownFlags =
      TRUN_DATA_OFFSET_PRESENT |
      TRUN_FIRST_SAMPLE_FLAGS_PRESENT |
      TRUN_SAMPLE_DURATION_PRESENT |
      TRUN_SAMPLE_SIZE_PRESENT |
      TRUN_SAMPLE_FLAGS_PRESENT |
      TRUN_SAMPLE_COMPOSITION_TIME_OFFSET_PRESENT;
    if ((flags & ~knownFlags) !== 0) return null;

    const sampleCount = readUint32BE(bytes, start + 4);
    totalSamples += sampleCount;
    if (totalSamples > MAX_SAMPLE_TABLE_ENTRIES) return null;
    let cursor = start + 8;
    let position: number;
    if (flags & TRUN_DATA_OFFSET_PRESENT) {
      if (cursor + 4 > trun.boxEnd) return null;
      position = baseDataOffset + readInt32BE(bytes, cursor);
      cursor += 4;
    } else {
      position = previousRunEnd ?? baseDataOffset;
    }
    if (!Number.isSafeInteger(position) || position < 0) return null;
    if (flags & TRUN_FIRST_SAMPLE_FLAGS_PRESENT) cursor += 4;

    for (let index = 0; index < sampleCount; index++) {
      if (flags & TRUN_SAMPLE_DURATION_PRESENT) cursor += 4;
      let sampleSize = defaultSampleSize;
      if (flags & TRUN_SAMPLE_SIZE_PRESENT) {
        if (cursor + 4 > trun.boxEnd) return null;
        sampleSize = readUint32BE(bytes, cursor);
        cursor += 4;
      }
      if (sampleSize === undefined || sampleSize === null) return null;
      if (flags & TRUN_SAMPLE_FLAGS_PRESENT) cursor += 4;
      if (flags & TRUN_SAMPLE_COMPOSITION_TIME_OFFSET_PRESENT) cursor += 4;
      if (cursor > trun.boxEnd) return null;

      const end = position + sampleSize;
      if (!Number.isSafeInteger(end) || end < position) return null;
      const range = { start: position, end };
      if (sampleSize > 0 && !isContainedInMediaData(range, mediaDataRanges)) return null;
      if (sampleSize > 0) ranges.push(range);
      position = end;
    }
    previousRunEnd = position;
  }
  return { trackId: header.trackId, ranges };
}

function addFragmentedMetadataPlans(
  bytes: Uint8Array,
  topLevelBoxes: LocatedBox[],
  mediaDataRanges: ByteRange[],
  plans: MetadataTrackPlan[],
): boolean {
  if (plans.length === 0) return true;
  const byTrackId = new Map<number, MetadataTrackPlan>();
  for (const plan of plans) {
    if (byTrackId.has(plan.trackId)) return false;
    byTrackId.set(plan.trackId, plan);
  }
  const trexDefaults = collectTrexDefaultSampleSizes(bytes, topLevelBoxes);
  if (!trexDefaults) return false;

  for (const moof of topLevelBoxes.filter((box) => box.type === "moof")) {
    const children = readChildBoxes(bytes, payloadStart(moof), moof.boxEnd);
    if (!children) return false;
    const trafs = children.filter((box) => box.type === "traf");
    for (const traf of trafs) {
      const trafChildren = readChildBoxes(bytes, payloadStart(traf), traf.boxEnd);
      if (!trafChildren) return false;
      const tfhd = findChild(trafChildren, "tfhd");
      if (!tfhd) return false;
      const header = readTrackFragmentHeader(bytes, tfhd);
      if (!header) return false;
      const plan = byTrackId.get(header.trackId);
      if (!plan) continue;

      const resolved = resolveTrackFragmentRanges(
        bytes,
        moof,
        traf,
        trafs.length,
        trexDefaults.get(header.trackId),
        mediaDataRanges,
      );
      if (!resolved || resolved.trackId !== header.trackId) return false;
      plan.sampleRanges.push(...resolved.ranges);
      plan.fragmentBoxes.push(traf);
    }
  }
  return true;
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
 * `com.apple.quicktime.location.ISO6709` GPS string live). Dedicated metadata
 * tracks are handled separately before this walk. Box sizes never change, so
 * `stco`/`co64` chunk-offset tables elsewhere in the file stay valid.
 */
function walkAndNeutralize(bytes: Uint8Array, start: number, end: number, timestampBoxType: string | null): boolean {
  let offset = start;
  while (offset < end) {
    const box = readBoxBounds(bytes, offset, end);
    if (!box) return false;
    const { type, headerLength, boxEnd } = box;

    if (type === "udta" || type === "meta") {
      neutralizeBox(bytes, { ...box, offset });
    } else if (type === "moov") {
      if (!walkAndNeutralize(bytes, offset + headerLength, boxEnd, "mvhd")) return false;
    } else if (type === "trak") {
      if (!walkAndNeutralize(bytes, offset + headerLength, boxEnd, "tkhd")) return false;
    } else if (type === "mdia") {
      if (!walkAndNeutralize(bytes, offset + headerLength, boxEnd, "mdhd")) return false;
    } else if (timestampBoxType && type === timestampBoxType) {
      zeroIsobmffTimestamps(bytes, offset + headerLength, boxEnd);
    }

    offset = boxEnd;
  }
  return true;
}

/**
 * Strips privacy-sensitive metadata from an MP4/MOV/M4A file (all share the
 * same ISOBMFF box structure). In addition to ordinary metadata boxes, Apple
 * `meta` tracks are removed and their timed samples in `mdat` are zeroed. The
 * classic sample tables and fragmented `tfhd`/`trun` runs are fully validated
 * before any mutation. Unsupported or ambiguous metadata-track layouts fail
 * safely; ordinary fragmented video/audio tracks are left byte-for-byte intact.
 */
export function stripIsobmffBoxes(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 8) return null;

  // Validate the complete top-level structure before mutating anything.
  const topLevelBoxes = readChildBoxes(bytes, 0, bytes.length);
  if (!topLevelBoxes || topLevelBoxes.length === 0) return null;

  const mediaDataRanges = topLevelBoxes
    .filter((box) => box.type === "mdat")
    .map((box) => ({ start: payloadStart(box), end: box.boxEnd }));
  const metadataTrackPlans = collectMetadataTrackPlans(bytes, topLevelBoxes, mediaDataRanges);
  if (!metadataTrackPlans) return null;
  if (!addFragmentedMetadataPlans(bytes, topLevelBoxes, mediaDataRanges, metadataTrackPlans)) return null;

  const result = bytes.slice();
  for (const { track, sampleRanges, fragmentBoxes } of metadataTrackPlans) {
    for (const { start, end } of sampleRanges) result.fill(0, start, end);
    for (const fragmentBox of fragmentBoxes) neutralizeBox(result, fragmentBox);
    neutralizeBox(result, track);
  }

  if (!walkAndNeutralize(result, 0, result.length, null)) return null;
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
