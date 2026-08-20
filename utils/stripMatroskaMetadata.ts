import { readEbmlVint, isEbmlUnknownSize } from "./binary";

// Matroska/EBML element IDs relevant to metadata stripping (ID includes its marker bit).
const ID_SEGMENT = 0x18538067;
const ID_INFO = 0x1549a966;
const ID_TRACKS = 0x1654ae6b;
const ID_TRACK_ENTRY = 0xae;
const ID_TAGS = 0x1254c367;
const ID_CHAPTERS = 0x1043a770;
const ID_ATTACHMENTS = 0x1941a469;
const ID_CLUSTER = 0x1f43b675;
const ID_VOID = 0xec;
const ID_WRITING_APP = 0x5741;
const ID_MUXING_APP = 0x4d80;
const ID_TRACK_NAME = 0x536e;
const ID_TRACK_LANGUAGE = 0x22b59c;
const ID_EBML_HEADER = 0x1a45dfa3;

type EbmlElement = { id: number; payloadStart: number; payloadEnd: number; unknownSize: boolean };

function readElement(bytes: Uint8Array, offset: number, rangeEnd: number): EbmlElement | null {
  const idVint = readEbmlVint(bytes, offset, true);
  if (!idVint) return null;
  const sizeVint = readEbmlVint(bytes, offset + idVint.length, false);
  if (!sizeVint) return null;

  const payloadStart = offset + idVint.length + sizeVint.length;
  const unknownSize = isEbmlUnknownSize(sizeVint.value, sizeVint.length);
  const payloadEnd = unknownSize ? rangeEnd : payloadStart + sizeVint.value;
  if (payloadEnd > rangeEnd || payloadEnd < payloadStart) return null;

  return { id: idVint.value, payloadStart, payloadEnd, unknownSize };
}

function neutralizeInfoStrings(bytes: Uint8Array, start: number, end: number): boolean {
  let offset = start;
  while (offset < end) {
    const el = readElement(bytes, offset, end);
    if (!el || el.unknownSize) return false;
    if (el.id === ID_WRITING_APP || el.id === ID_MUXING_APP) {
      for (let i = el.payloadStart; i < el.payloadEnd; i++) bytes[i] = 0;
    }
    offset = el.payloadEnd;
  }
  return true;
}

function neutralizeTrackEntry(bytes: Uint8Array, start: number, end: number): boolean {
  let offset = start;
  while (offset < end) {
    const el = readElement(bytes, offset, end);
    if (!el || el.unknownSize) return false;
    if (el.id === ID_TRACK_NAME || el.id === ID_TRACK_LANGUAGE) {
      for (let i = el.payloadStart; i < el.payloadEnd; i++) bytes[i] = 0;
    }
    offset = el.payloadEnd;
  }
  return true;
}

function walkTracks(bytes: Uint8Array, start: number, end: number): boolean {
  let offset = start;
  while (offset < end) {
    const el = readElement(bytes, offset, end);
    if (!el || el.unknownSize) return false;
    if (el.id === ID_TRACK_ENTRY && !neutralizeTrackEntry(bytes, el.payloadStart, el.payloadEnd)) return false;
    offset = el.payloadEnd;
  }
  return true;
}

/** Finds the smallest N (1-8 bytes) such that an N-byte EBML size VINT can
 * hold `payloadLength - 1 - N` as its value (the 1 accounts for the Void
 * element's 1-byte ID), using EBML's legal non-minimal VINT length padding. */
function findVoidSizeVintLength(payloadLength: number): number | null {
  for (let n = 1; n <= 8; n++) {
    const remaining = payloadLength - 1 - n;
    if (remaining < 0) continue;
    if (remaining <= Math.pow(2, 7 * n) - 1) return n;
  }
  return null;
}

/** Overwrites an element's payload span with a single synthetic Void element
 * (ID 0xEC) sized to exactly fill the span, so no other offsets shift. If the
 * span is too small to hold a valid Void, the content is left as-is rather
 * than failing the whole file - a real Tags element is never this small. */
function neutralizeAsVoid(bytes: Uint8Array, start: number, end: number): boolean {
  const length = end - start;
  if (length === 0) return true;

  const n = findVoidSizeVintLength(length);
  if (n === null) return true;

  const remaining = length - 1 - n;
  bytes[start] = ID_VOID;

  const firstByteMarker = 0x80 >> (n - 1);
  let value = remaining;
  for (let i = n - 1; i >= 1; i--) {
    bytes[start + 1 + i] = value & 0xff;
    value = Math.floor(value / 256);
  }
  bytes[start + 1] = (value & (firstByteMarker - 1)) | firstByteMarker;

  for (let i = start + 1 + n; i < end; i++) bytes[i] = 0;
  return true;
}

/**
 * Recursively walks Segment/Info/Tracks/TrackEntry, neutralizing `Tags`,
 * `Chapters`, and `Attachments` (rewritten as same-sized `Void` elements) and
 * zeroing `SegmentInfo`'s WritingApp/MuxingApp and per-track Name/Language strings. `Cluster` is
 * skipped wholesale via its size field - it's audio/video data, never
 * descended into. Tolerates the top-level `Segment`'s "unknown size" (extends
 * to EOF) encoding, common from streamed/live-muxed WebM; an unknown size
 * anywhere else is treated as unsupported (returns false) rather than guessed
 * at, since correctly bounding it requires schema-aware child-ID validation.
 */
function walkAndNeutralize(bytes: Uint8Array, start: number, end: number, isTopLevel: boolean): boolean {
  let offset = start;
  while (offset < end) {
    const el = readElement(bytes, offset, end);
    if (!el) return false;
    if (el.unknownSize && !(isTopLevel && el.id === ID_SEGMENT)) return false;

    if (el.id === ID_SEGMENT) {
      if (!walkAndNeutralize(bytes, el.payloadStart, el.payloadEnd, false)) return false;
    } else if (el.id === ID_INFO) {
      if (!neutralizeInfoStrings(bytes, el.payloadStart, el.payloadEnd)) return false;
    } else if (el.id === ID_TRACKS) {
      if (!walkTracks(bytes, el.payloadStart, el.payloadEnd)) return false;
    } else if (el.id === ID_TAGS || el.id === ID_CHAPTERS || el.id === ID_ATTACHMENTS) {
      if (!neutralizeAsVoid(bytes, el.payloadStart, el.payloadEnd)) return false;
    }
    // ID_CLUSTER and anything else (SeekHead, Cues, the EBML header) is left
    // untouched and not descended into.

    offset = el.payloadEnd;
  }
  return true;
}

export function stripEbmlElements(bytes: Uint8Array): Uint8Array | null {
  const header = readEbmlVint(bytes, 0, true);
  if (!header || header.value !== ID_EBML_HEADER) return null;

  const result = bytes.slice();
  if (!walkAndNeutralize(result, 0, result.length, true)) return null;
  return result;
}

export async function stripMatroskaMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripEbmlElements(bytes);
    if (!cleaned) return null;
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("Matroska metadata stripping failed:", err);
    return null;
  }
}
