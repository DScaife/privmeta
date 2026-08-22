import { concatBytes, readUint32LE, writeUint32LE } from "./binary";

type RiffChunk = { id: string; payloadStart: number; payloadSize: number; end: number };

/** Reads one RIFF chunk header (4-byte ID + 4-byte LE size), accounting for the
 * word-alignment pad byte when the payload size is odd. */
function readChunkHeader(bytes: Uint8Array, offset: number): RiffChunk | null {
  if (offset + 8 > bytes.length) return null;
  const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
  const payloadSize = readUint32LE(bytes, offset + 4);
  const payloadStart = offset + 8;
  if (payloadStart + payloadSize > bytes.length) return null;
  const pad = payloadSize % 2 === 1 ? 1 : 0;
  return { id, payloadStart, payloadSize, end: payloadStart + payloadSize + pad };
}

/**
 * Strips metadata chunks from a WAV file by dropping LIST/INFO, `bext` and
 * `id3 ` chunks entirely and copying everything else byte-for-byte - `fmt `/
 * `data`/`fact` are never touched. Returns null if the bytes don't parse as a
 * RIFF/WAVE file.
 */
export function stripRiffChunks(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 12) return null;
  const riffId = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riffId !== "RIFF") return null;
  const formType = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (formType !== "WAVE") return null;

  const kept: Uint8Array[] = [];
  let offset = 12;

  while (offset < bytes.length) {
    const chunk = readChunkHeader(bytes, offset);
    if (!chunk) return null;
    const { id, payloadStart, end } = chunk;

    if (id === "LIST") {
      const listType = String.fromCharCode(...bytes.subarray(payloadStart, payloadStart + 4));
      if (listType === "INFO") {
        offset = end;
        continue;
      }
      kept.push(bytes.subarray(offset, end));
      offset = end;
      continue;
    }

    if (id === "bext" || id.toLowerCase() === "id3 ") {
      offset = end;
      continue;
    }

    kept.push(bytes.subarray(offset, end));
    offset = end;
  }

  const result = concatBytes([bytes.subarray(0, 12), ...kept]);
  writeUint32LE(result, 4, result.length - 8);
  return result;
}

export async function stripRiffMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripRiffChunks(bytes);
    if (!cleaned) return null;
    return new File([cleaned as BlobPart], file.name, { type: file.type });
  } catch (err) {
    console.error("RIFF metadata stripping failed:", err);
    return null;
  }
}
