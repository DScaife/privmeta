import { PDFDocument, PDFName } from "pdf-lib";
import { concatBytes, matchesAscii, readUint32LE, writeUint32LE } from "./binary";
import { inspectRasterAnimation, type RasterAnimationStatus } from "./imageAnimation";

export { stripContainerMetadata } from "./stripContainerMetadata";

// JPEG markers whose segments carry metadata rather than image data:
// APP1 (0xE1) = EXIF and XMP, APP13 (0xED) = IPTC/Photoshop IRB, COM (0xFE) = comments.
// APP0 (JFIF), APP2 (ICC color profile) and APP14 (Adobe color transform) are kept
// because removing them can change how the image is decoded or displayed.
const STRIPPED_JPEG_MARKERS = new Set([0xe1, 0xed, 0xfe]);

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

export async function stripImageMetadata(
  file: File,
  knownAnimationStatus?: RasterAnimationStatus,
): Promise<File | null> {
  const animationStatus = knownAnimationStatus ?? await inspectRasterAnimation(file);
  if (animationStatus === "animated" || animationStatus === "invalid") {
    console.error(
      animationStatus === "animated"
        ? "Animated PNG/WebP files are rejected to avoid flattening their frames."
        : "Invalid PNG/WebP container rejected.",
    );
    return null;
  }

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
        if (file.type === "image/webp") {
          blob
            .arrayBuffer()
            .then((buffer) => stripWebpMetadataChunks(new Uint8Array(buffer)))
            .then((bytes) => finish(bytes ? new File([bytes as BlobPart], file.name, { type: file.type }) : null))
            .catch(() => finish(null));
          return;
        }
        finish(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };

    img.onerror = () => finish(null);

    img.src = url;
  });
}

/**
 * Removes metadata chunks that Chromium may add while encoding WebP. If the
 * extended header has no remaining alpha/animation features, it is redundant
 * and is removed too, yielding a normal simple WebP container.
 */
export function stripWebpMetadataChunks(bytes: Uint8Array): Uint8Array | null {
  if (
    bytes.length < 12 ||
    !matchesAscii(bytes, 0, "RIFF") ||
    !matchesAscii(bytes, 8, "WEBP")
  ) {
    return null;
  }

  const chunks: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const size = readUint32LE(bytes, offset + 4);
    const paddedSize = size + (size & 1);
    const end = offset + 8 + paddedSize;
    if (end > bytes.length) return null;

    const isMetadata =
      matchesAscii(bytes, offset, "ICCP") ||
      matchesAscii(bytes, offset, "EXIF") ||
      matchesAscii(bytes, offset, "XMP ");
    if (!isMetadata) {
      if (matchesAscii(bytes, offset, "VP8X") && size >= 10) {
        const chunk = bytes.slice(offset, end);
        // ICC, EXIF and XMP flags respectively. Leave alpha and animation.
        chunk[8] &= ~(0x20 | 0x08 | 0x04);
        if ((chunk[8] & (0x10 | 0x02)) !== 0) chunks.push(chunk);
      } else {
        chunks.push(bytes.slice(offset, end));
      }
    }
    offset = end;
  }
  if (offset !== bytes.length) return null;

  const totalSize = 12 + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalSize);
  output.set(bytes.subarray(0, 12), 0);
  writeUint32LE(output, 4, totalSize - 8);
  let outputOffset = 12;
  for (const chunk of chunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.length;
  }
  return output;
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

/**
 * Clears identity-bearing WordprocessingML attributes while preserving visible
 * document text, comments, and revision markup. Namespace prefixes are not
 * assumed: valid OOXML producers may choose prefixes other than `w`/`w15`.
 */
export function sanitizeWordprocessingXml(xml: string): string {
  let cleaned = xml;

  // Word's revision-session table is non-content metadata and can be removed
  // wholesale. Individual rsid attributes are removed below as well.
  cleaned = cleaned.replace(
    /<([A-Za-z_][\w.-]*):rsids\b[^>]*>[\s\S]*?<\/\1:rsids\s*>/gi,
    "",
  );

  // These string attributes identify comment/revision authors or their Office
  // account. Keep an empty attribute where some OOXML versions require it.
  cleaned = cleaned.replace(
    /(\s(?:[A-Za-z_][\w.-]*:)?(?:author|initials|providerId|userId|personId)\s*=\s*)(["'])[^"'<>]*\2/gi,
    (_match, prefix: string, quote: string) => `${prefix}${quote}${quote}`,
  );

  // Revision dates and identifiers carry editing history but are not needed to
  // render the current document or its comment text.
  cleaned = cleaned.replace(
    /\s+(?:[A-Za-z_][\w.-]*:)?(?:date(?:Utc)?|durableId|rsid[A-Za-z0-9_.-]*)\s*=\s*(["'])[^"'<>]*\1/gi,
    "",
  );

  return cleaned;
}

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

    // Identity can also occur in tracked changes, comments, headers, footers,
    // notes, settings, and Office's people part. Sanitize every Word XML part
    // so less-common document stories receive the same treatment.
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || !/^word\/.*\.xml$/i.test(entry.name)) continue;
      const xml = await entry.async("string");
      const cleanedXml = sanitizeWordprocessingXml(xml);
      if (cleanedXml !== xml) zip.file(entry.name, cleanedXml);
    }

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
