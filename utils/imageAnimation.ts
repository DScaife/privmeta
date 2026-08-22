import { matchesAscii, readUint32BE, readUint32LE } from "./binary";

export type RasterAnimationStatus = "not-applicable" | "static" | "animated" | "invalid";

const PNG_SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

/**
 * Inspects PNG container chunks without decoding pixels. APNG control/frame
 * chunks mean canvas would flatten the file, so callers must reject it.
 */
export function inspectPngAnimation(bytes: Uint8Array): Exclude<RasterAnimationStatus, "not-applicable"> {
  if (bytes.length < PNG_SIGNATURE.length) return "invalid";
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return "invalid";
  }

  let offset = PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let animated = false;

  while (offset + 12 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    if (length > bytes.length - offset - 12) return "invalid";

    const typeOffset = offset + 4;
    if (chunkIndex === 0 && (!matchesAscii(bytes, typeOffset, "IHDR") || length !== 13)) {
      return "invalid";
    }

    if (
      matchesAscii(bytes, typeOffset, "acTL") ||
      matchesAscii(bytes, typeOffset, "fcTL") ||
      matchesAscii(bytes, typeOffset, "fdAT")
    ) {
      animated = true;
    }

    offset += 12 + length;
    chunkIndex++;
    if (matchesAscii(bytes, typeOffset, "IEND")) {
      return length === 0 && offset === bytes.length ? (animated ? "animated" : "static") : "invalid";
    }
  }

  return "invalid";
}

/** Inspects RIFF/WebP feature and animation chunks without decoding pixels. */
export function inspectWebpAnimation(bytes: Uint8Array): Exclude<RasterAnimationStatus, "not-applicable"> {
  if (
    bytes.length < 12 ||
    !matchesAscii(bytes, 0, "RIFF") ||
    !matchesAscii(bytes, 8, "WEBP") ||
    readUint32LE(bytes, 4) + 8 !== bytes.length
  ) {
    return "invalid";
  }

  let offset = 12;
  let chunkCount = 0;
  let animated = false;
  while (offset + 8 <= bytes.length) {
    const size = readUint32LE(bytes, offset + 4);
    if (size > bytes.length - offset - 8) return "invalid";
    const paddedSize = size + (size & 1);
    if (paddedSize > bytes.length - offset - 8) return "invalid";

    if (
      matchesAscii(bytes, offset, "ANIM") ||
      matchesAscii(bytes, offset, "ANMF") ||
      (matchesAscii(bytes, offset, "VP8X") && size >= 10 && (bytes[offset + 8] & 0x02) !== 0)
    ) {
      animated = true;
    }

    offset += 8 + paddedSize;
    chunkCount++;
  }

  if (offset !== bytes.length || chunkCount === 0) return "invalid";
  return animated ? "animated" : "static";
}

export async function inspectRasterAnimation(file: File): Promise<RasterAnimationStatus> {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (extension !== ".png" && extension !== ".webp") return "not-applicable";

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return extension === ".png" ? inspectPngAnimation(bytes) : inspectWebpAnimation(bytes);
  } catch {
    return "invalid";
  }
}
