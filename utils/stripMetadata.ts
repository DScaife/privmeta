import { PDFDocument, PDFName } from "pdf-lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpegLoad: Promise<FFmpeg> | null = null;

function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegLoad) {
    ffmpegLoad = (async () => {
      const instance = new FFmpeg();
      // Self-hosted core (copied to public/ by scripts/copy-ffmpeg-core.mjs).
      // Without explicit URLs the library fetches the core from a third-party CDN,
      // which would break processing for users who go offline. classWorkerURL
      // must point at the unbundled worker: the bundled copy rewrites the
      // worker's dynamic import of the core and fails at runtime.
      // Fully-qualified URLs: the library resolves relative URLs against the
      // bundled chunk's import.meta.url, which is not a page-origin URL.
      await instance.load({
        coreURL: `${location.origin}/ffmpeg/ffmpeg-core.js`,
        wasmURL: `${location.origin}/ffmpeg/ffmpeg-core.wasm`,
        classWorkerURL: `${location.origin}/ffmpeg/worker.js`,
      });
      return instance;
    })().catch((err) => {
      ffmpegLoad = null; // allow a retry, e.g. after a failed fetch while offline
      throw err;
    });
  }
  return ffmpegLoad;
}

/**
 * Warms up the ffmpeg core so audio/video processing still works if the
 * user follows the site's advice and goes offline before hitting "Remove".
 */
export async function preloadFfmpeg(): Promise<void> {
  try {
    await getFFmpeg();
  } catch {
    // best-effort: a failed preload is retried (and surfaced) at processing time
  }
}

// JPEG markers whose segments carry metadata rather than image data:
// APP1 (0xE1) = EXIF and XMP, APP13 (0xED) = IPTC/Photoshop IRB, COM (0xFE) = comments.
// APP0 (JFIF), APP2 (ICC color profile) and APP14 (Adobe color transform) are kept
// because removing them can change how the image is decoded or displayed.
const STRIPPED_JPEG_MARKERS = new Set([0xe1, 0xed, 0xfe]);

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(
    chunks.reduce((total, chunk) => total + chunk.length, 0),
  );
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

/**
 * Removes metadata segments from a JPEG by walking its segment structure and
 * dropping EXIF/XMP/IPTC/comment segments, copying everything else verbatim.
 * Lossless - the compressed image data is untouched. Returns null if the bytes
 * don't parse as a JPEG (caller falls back to a canvas re-encode).
 */
export function stripJpegSegments(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  const kept: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
  let offset = 2;

  while (offset + 2 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];

    // Padding: fill bytes of 0xFF may precede a marker
    if (marker === 0xff) {
      offset += 1;
      continue;
    }

    // SOS: entropy-coded image data follows - copy the remainder verbatim
    if (marker === 0xda) {
      kept.push(bytes.subarray(offset));
      return concatBytes(kept);
    }

    // Standalone markers without a length field (TEM, RST0-RST7)
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(bytes.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > bytes.length) return null;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) return null;

    if (!STRIPPED_JPEG_MARKERS.has(marker)) {
      kept.push(bytes.subarray(offset, offset + 2 + length));
    }
    offset += 2 + length;
  }
  return null;
}

export async function stripJpegMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripJpegSegments(bytes);
    if (!cleaned) {
      return stripImageMetadata(file);
    }
    return new File([cleaned as BlobPart], file.name, { type: "image/jpeg" });
  } catch (err) {
    console.error(
      "JPEG metadata stripping failed, falling back to canvas re-encode:",
      err,
    );
    return stripImageMetadata(file);
  }
}

/**
 * Removes metadata blocks from a GIF by walking its block structure and dropping
 * comment, plain-text and non-animation application extensions (XMP travels as an
 * application extension). Frames, palettes and pixel data are copied byte-for-byte,
 * so the image is untouched - no re-encode, no palette/dither artifacts.
 * Returns null if the bytes don't parse as a GIF.
 */
export function stripGifBlocks(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 13) return null;
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== "GIF87a" && signature !== "GIF89a") return null;

  const kept: Uint8Array[] = [];

  // Header + Logical Screen Descriptor (+ Global Color Table if flagged)
  const lsdPacked = bytes[10];
  let offset = 13 + (lsdPacked & 0x80 ? 3 * (1 << ((lsdPacked & 0x07) + 1)) : 0);
  if (offset > bytes.length) return null;
  kept.push(bytes.subarray(0, offset));

  // Advances past a chain of data sub-blocks, returning the position after the terminator
  const skipSubBlocks = (pos: number): number | null => {
    while (pos < bytes.length) {
      const size = bytes[pos];
      pos += 1 + size;
      if (size === 0) return pos;
    }
    return null;
  };

  while (offset < bytes.length) {
    const block = bytes[offset];

    if (block === 0x3b) {
      // Trailer
      kept.push(bytes.subarray(offset, offset + 1));
      return concatBytes(kept);
    }

    if (block === 0x21) {
      // Extension block. Keep only what rendering needs: the Graphic Control
      // Extension (frame timing/transparency) and the NETSCAPE/ANIMEXTS
      // application extension (loop count). Comments, plain text, XMP and any
      // other application data are metadata - drop them.
      if (offset + 3 > bytes.length) return null;
      const label = bytes[offset + 1];
      let keep = false;
      if (label === 0xf9) {
        keep = true;
      } else if (label === 0xff) {
        const identSize = bytes[offset + 2];
        const ident = String.fromCharCode(
          ...bytes.subarray(offset + 3, offset + 3 + identSize),
        );
        keep = ident.startsWith("NETSCAPE") || ident.startsWith("ANIMEXTS");
      }
      const endPos = skipSubBlocks(offset + 2);
      if (endPos === null || endPos > bytes.length) return null;
      if (keep) kept.push(bytes.subarray(offset, endPos));
      offset = endPos;
      continue;
    }

    if (block === 0x2c) {
      // Image descriptor (+ Local Color Table) + LZW-compressed frame data
      if (offset + 11 > bytes.length) return null;
      const imgPacked = bytes[offset + 9];
      let pos =
        offset + 10 + (imgPacked & 0x80 ? 3 * (1 << ((imgPacked & 0x07) + 1)) : 0);
      pos += 1; // LZW minimum code size byte
      const endPos = skipSubBlocks(pos);
      if (endPos === null || endPos > bytes.length) return null;
      kept.push(bytes.subarray(offset, endPos));
      offset = endPos;
      continue;
    }

    return null; // unknown top-level block: bail out rather than guess
  }

  // Tolerate a missing trailer - decoders do too
  return concatBytes(kept);
}

export async function stripGifMetadata(file: File): Promise<File | null> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const cleaned = stripGifBlocks(bytes);
    if (!cleaned) return null;
    return new File([cleaned as BlobPart], file.name, { type: "image/gif" });
  } catch (err) {
    console.error("GIF metadata stripping failed:", err);
    return null;
  }
}

const FFMPEG_EXTENSIONS = [
  "wav",
  "mp3",
  "flac",
  "aac",
  "ogg",
  "m4a",
  "mp4",
  "webm",
  "avi",
  "mov",
  "mkv",
];

/** Strips metadata from audio and video files via ffmpeg.wasm (streams are copied, not re-encoded). */
export async function stripFfmpegMetadata(file: File): Promise<File | null> {
  if (typeof window === "undefined") return null;

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !FFMPEG_EXTENSIONS.includes(extension)) {
    console.error("Unsupported format for ffmpeg metadata stripping");
    return null;
  }

  const inputFile = `input.${extension}`;
  const outputFile = `output.${extension}`;
  let ffmpeg: FFmpeg | null = null;

  try {
    ffmpeg = await getFFmpeg();
    await ffmpeg.writeFile(inputFile, await fetchFile(file));
    // -map 0 keeps every stream (without it ffmpeg picks one video + one audio track,
    // silently dropping secondary audio and subtitles); -map_metadata -1 drops the
    // container metadata and the :s:v/:s:a forms drop per-stream tags (handler names,
    // per-stream creation times); +bitexact stops the muxer writing its own tags.
    await ffmpeg.exec([
      "-i",
      inputFile,
      "-map",
      "0",
      "-map_metadata",
      "-1",
      "-map_metadata:s:v",
      "-1",
      "-map_metadata:s:a",
      "-1",
      "-fflags",
      "+bitexact",
      "-c",
      "copy",
      outputFile,
    ]);
    const data = await ffmpeg.readFile(outputFile);
    const mimeType = file.type || "application/octet-stream";
    return new File(
      [new Blob([data as BlobPart], { type: mimeType })],
      file.name,
      { type: mimeType },
    );
  } catch (err) {
    console.error("ffmpeg metadata stripping failed:", err);
    return null;
  } finally {
    // Free the wasm virtual filesystem - written files otherwise persist for the page lifetime
    if (ffmpeg) {
      for (const name of [inputFile, outputFile]) {
        try {
          await ffmpeg.deleteFile(name);
        } catch {
          // file may not exist if the run failed early
        }
      }
    }
  }
}

export async function stripImageMetadata(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const finish = (result: File | null) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          finish(null);
          return;
        }
        finish(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };

    img.onerror = () => finish(null);

    img.src = url;
  });
}

export async function stripPdfMetadata(file: File): Promise<File | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Load without forcing metadata updates
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      updateMetadata: false,
    });

    // --- Remove XMP / Metadata stream from the Catalog (if present) ---
    const metadataKey = PDFName.of("Metadata");
    if (pdfDoc.catalog.get(metadataKey)) {
      pdfDoc.catalog.delete(metadataKey);
    }

    // --- Clear text fields first (modifies the existing Info dict in-place so the
    //     original values are overwritten in the serialized output, not just de-referenced) ---
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    // --- Remove the Info dict reference from the trailer entirely.
    //     Do this AFTER the set* calls above - calling set* first rewrites the existing
    //     Info object's fields in-place, then we remove the trailer pointer so no Info
    //     dict is visible to PDF readers. Dates are intentionally not set to epoch
    //     (D:19700101) as that pattern is an identifiable fingerprint. ---
    if (pdfDoc.context?.trailerInfo?.Info) {
      delete pdfDoc.context.trailerInfo.Info;
    }

    // --- Remove the document /ID pair - it persists across edits and can link
    //     a cleaned file back to its original ---
    if (pdfDoc.context?.trailerInfo?.ID) {
      delete pdfDoc.context.trailerInfo.ID;
    }

    const newPdfBytes = await pdfDoc.save({ useObjectStreams: false });

    return new File([newPdfBytes as BlobPart], file.name, {
      type: "application/pdf",
    });
  } catch (err) {
    console.error("PDF metadata stripping failed:", err);
    return null;
  }
}

let cachedJSZip: import("jszip") | null = null;

// Known limitation: author names embedded in the document body (tracked changes,
// comments, w:rsid revision IDs in word/*.xml) are not scrubbed - only the
// document-level properties parts are removed.
export async function stripDocxMetadata(file: File): Promise<File | null> {
  try {
    if (!file.name.endsWith(".docx")) {
      throw new Error("Unsupported file type. Only .docx files are allowed.");
    }

    if (!cachedJSZip) {
      cachedJSZip = (await import("jszip")).default;
    }

    const zip = await cachedJSZip.loadAsync(file);

    if (!zip.file("word/document.xml")) {
      throw new Error("Invalid DOCX file structure.");
    }

    // The entire docProps folder is document metadata: core.xml (author, dates),
    // app.xml (application, edit time), custom.xml and the page-1 thumbnail
    zip.remove("docProps");

    // DEFLATE the rebuilt archive: a .docx is a compressed zip, but JSZip
    // defaults to STORE (no compression), which would balloon the file ~10x.
    const cleanedBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new File([cleanedBlob], file.name, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (err) {
    console.error("Failed to strip metadata from DOCX:", err);
    return null;
  }
}
