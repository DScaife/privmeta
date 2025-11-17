import { PDFDocument, PDFName } from "pdf-lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export async function stripVideoMetadata(file: File): Promise<File | null> {
  try {
    if (typeof window === "undefined") return null;

    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["mp4", "webm", "avi"].includes(extension)) {
      throw new Error("Unsupported video format");
    }

    const inputFile = `input.${extension}`;
    const outputFile = `output.${extension}`;
    const mimeType = file.type || `video/${extension}`;

    await ffmpeg.writeFile(inputFile, await fetchFile(file));

    await ffmpeg.exec(["-i", inputFile, "-map_metadata", "-1", "-metadata", "encoder=", "-c", "copy", outputFile]);

    const data = await ffmpeg.readFile(outputFile);
    const blob = new Blob([data as BlobPart], { type: mimeType });
    const cleanedFile = new File([blob], file.name.replace(/\.[^.]+$/, `_cleaned.${extension}`), {
      type: mimeType,
    });

    return cleanedFile;
  } catch (err) {
    console.error("Video metadata stripping failed:", err);
    return null;
  }
}

export async function stripImageMetadata(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        const newFile = new File([blob], file.name, {
          type: file.type,
        });
        resolve(newFile);
        URL.revokeObjectURL(url);
      }, file.type);
    };

    img.onerror = () => {
      resolve(null);
    };

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

    if (pdfDoc.context && pdfDoc.context.trailerInfo?.Info) {
      delete pdfDoc.context.trailerInfo.Info;
    }

    // --- Clear common metadata fields explicitly ---
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    // pdf-lib requires a Date object — use epoch (neutral) instead of undefined
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));

    const newPdfBytes = await pdfDoc.save({ useObjectStreams: false });

    return new File([newPdfBytes as BlobPart], file.name, { type: "application/pdf" });
  } catch (err) {
    console.error("PDF metadata stripping failed:", err);
    return null;
  }
}

let cachedJSZip: import("jszip") | null = null;

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

    const metadataPaths = ["docProps/core.xml", "docProps/app.xml", "docProps/custom.xml"];

    for (const path of metadataPaths) {
      if (zip.file(path)) {
        zip.remove(path);
      }
    }

    const cleanedBlob = await zip.generateAsync({ type: "blob" });

    return new File([cleanedBlob], file.name, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (err) {
    console.error(`Failed to strip metadata from DOCX (${file.name}):`, err);
    return null;
  }
}
