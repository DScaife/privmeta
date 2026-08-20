import { expect, test } from "@playwright/test";
import { getTotalFileSizeBytes, MAX_TOTAL_FILE_SIZE_BYTES } from "../../utils/constants";
import { inspectPngAnimation, inspectWebpAnimation } from "../../utils/imageAnimation";

function ascii(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function uint32Be(value: number): Uint8Array {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value);
  return result;
}

function uint32Le(value: number): Uint8Array {
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, true);
  return result;
}

function pngChunk(type: string, payload = new Uint8Array()): Uint8Array {
  // CRC bytes are present but do not need calculating: the structural detector
  // deliberately does not duplicate the decoder's CRC validation.
  return concat(uint32Be(payload.length), ascii(type), payload, new Uint8Array(4));
}

function png(...chunks: Uint8Array[]): Uint8Array {
  return concat(
    Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    pngChunk("IHDR", new Uint8Array(13)),
    ...chunks,
    pngChunk("IEND"),
  );
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  return concat(ascii(type), uint32Le(payload.length), payload, payload.length & 1 ? Uint8Array.of(0) : new Uint8Array());
}

function webp(...chunks: Uint8Array[]): Uint8Array {
  const body = concat(ascii("WEBP"), ...chunks);
  return concat(ascii("RIFF"), uint32Le(body.length), body);
}

test("distinguishes static PNG from APNG chunks", () => {
  expect(inspectPngAnimation(png(pngChunk("IDAT")))).toBe("static");
  expect(inspectPngAnimation(png(pngChunk("acTL", new Uint8Array(8)), pngChunk("IDAT")))).toBe("animated");
  expect(inspectPngAnimation(png(pngChunk("fcTL", new Uint8Array(26)), pngChunk("IDAT")))).toBe("animated");
});

test("distinguishes static WebP from every animation signal", () => {
  expect(inspectWebpAnimation(webp(webpChunk("VP8 ", new Uint8Array(4))))).toBe("static");
  expect(inspectWebpAnimation(webp(webpChunk("ANIM", new Uint8Array(6))))).toBe("animated");
  expect(inspectWebpAnimation(webp(webpChunk("ANMF", new Uint8Array(16))))).toBe("animated");

  const extendedHeader = new Uint8Array(10);
  extendedHeader[0] = 0x02;
  expect(inspectWebpAnimation(webp(webpChunk("VP8X", extendedHeader)))).toBe("animated");
});

test("fails closed on malformed PNG and WebP containers", () => {
  expect(inspectPngAnimation(png(pngChunk("IDAT")).subarray(0, 20))).toBe("invalid");

  const malformedWebp = webp(webpChunk("VP8 ", new Uint8Array(4)));
  malformedWebp[4] = 0;
  expect(inspectWebpAnimation(malformedWebp)).toBe("invalid");
});

test("aggregate file-size accounting enforces the queue boundary", () => {
  expect(getTotalFileSizeBytes([{ size: 25 }, { size: 75 }])).toBe(100);
  expect(getTotalFileSizeBytes([{ size: MAX_TOTAL_FILE_SIZE_BYTES }])).toBe(MAX_TOTAL_FILE_SIZE_BYTES);
  expect(getTotalFileSizeBytes([{ size: MAX_TOTAL_FILE_SIZE_BYTES }, { size: 1 }])).toBeGreaterThan(
    MAX_TOTAL_FILE_SIZE_BYTES,
  );
});
