/** Low-level byte-reading/writing primitives shared by the container-format metadata strippers. */

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

export function matchesAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (offset < 0 || offset + text.length > bytes.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

export function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]
  );
}

export function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + bytes[offset + 3] * 0x1000000
  );
}

export function writeUint32LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

/** Reads a 64-bit big-endian integer (MP4 box `largesize`). Returns null if it exceeds safe integer range. */
export function readUint64BE(bytes: Uint8Array, offset: number): number | null {
  const high = readUint32BE(bytes, offset);
  const low = readUint32BE(bytes, offset + 4);
  const value = high * 0x100000000 + low;
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Decodes an ID3v2 "synchsafe" 4-byte size field: only the low 7 bits of each
 * byte are used (the high bit is always 0), so it's NOT a plain 32-bit int.
 */
export function readSynchsafeUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 21) | (bytes[offset + 1] << 14) | (bytes[offset + 2] << 7) | bytes[offset + 3]
  );
}

/**
 * Reads one EBML variable-length integer (VINT) at `offset`. The number of
 * leading zero bits in the first byte before the first 1-bit determines the
 * total length (1-8 bytes). For element IDs, `keepMarker` should be true (the
 * marker bit is conventionally part of the ID's value). For sizes, it should
 * be false (the marker bit is stripped, leaving only the value bits).
 */
export function readEbmlVint(
  bytes: Uint8Array,
  offset: number,
  keepMarker: boolean,
): { value: number; length: number } | null {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  if (first === 0) return null; // >8-byte VINT: not valid in practice, unsupported

  let length = 1;
  let mask = 0x80;
  while (!(first & mask)) {
    mask >>= 1;
    length++;
  }
  if (offset + length > bytes.length) return null;

  let value = keepMarker ? first : first & (mask - 1);
  for (let i = 1; i < length; i++) {
    value = value * 256 + bytes[offset + i];
  }
  return { value, length };
}

/** True if an EBML size VINT's value is the "unknown size" sentinel (all value bits set to 1). */
export function isEbmlUnknownSize(value: number, length: number): boolean {
  const bitCount = length * 7;
  return value === Math.pow(2, bitCount) - 1;
}

/**
 * CRC32 table/function matching libogg's exact variant: non-reflected,
 * MSB-first, generator polynomial 0x04C11DB7, no input/output bit reflection,
 * no final XOR. This is a DIFFERENT algorithm from the common reflected CRC-32
 * (zlib/PKZIP/PNG/`crc-32` npm package) - do not substitute that one here.
 */
const OGG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n << 24;
    for (let k = 0; k < 8; k++) {
      c = c & 0x80000000 ? ((c << 1) ^ 0x04c11db7) >>> 0 : (c << 1) >>> 0;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32Ogg(bytes: Uint8Array): number {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc = ((crc << 8) ^ OGG_CRC_TABLE[((crc >>> 24) ^ bytes[i]) & 0xff]) >>> 0;
  }
  return crc >>> 0;
}
