import { PDFDocument, PDFName } from "pdf-lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import piexif from "piexifjs";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load();
  }
  return ffmpegInstance;
}

export async function stripJpegMetadata(file: File): Promise<File | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read JPEG data as Data URL"));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read JPEG file"));
      reader.readAsDataURL(file);
    });

    const cleanedDataUrl = piexif.remove(dataUrl);
    const cleanedBlob = await (await fetch(cleanedDataUrl)).blob();

    return new File([cleanedBlob], file.name, { type: "image/jpeg" });
  } catch (err) {
    console.error("JPEG metadata stripping failed, falling back to canvas re-encode:", err);
    return stripImageMetadata(file);
  }
}

export async function stripAudioMetadata(file: File): Promise<File | null> {
  try {
    if (typeof window === "undefined") return null;
    const ffmpeg = await getFFmpeg();
    const extension = file.name.split(".").pop()?.toLowerCase();
    const supported = ["wav", "mp3", "flac", "aac", "ogg", "m4a"];
    if (!extension || !supported.includes(extension)) {
      throw new Error("Unsupported audio format");
    }
    const inputFile = `input.${extension}`;
    const outputFile = `output.${extension}`;
    const mimeType = file.type || `audio/${extension}`;
    await ffmpeg.writeFile(inputFile, await fetchFile(file));
    await ffmpeg.exec(["-i", inputFile, "-map_metadata", "-1", "-metadata", "encoder=", "-c", "copy", outputFile]);
    const data = await ffmpeg.readFile(outputFile);
    const blob = new Blob([data as BlobPart], { type: mimeType });
    const cleanedFile = new File([blob], file.name.replace(/\.[^.]+$/, `_cleaned.${extension}`), { type: mimeType });
    return cleanedFile;
  } catch (err) {
    console.error("Audio metadata stripping failed:", err);
    return null;
  }
}

export async function stripVideoMetadata(file: File): Promise<File | null> {
  try {
    if (typeof window === "undefined") return null;

    const ffmpeg = await getFFmpeg();

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["mp4", "webm", "avi", "mov", "mkv"].includes(extension)) {
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

    // --- Clear text fields first (modifies the existing Info dict in-place so the
    //     original values are overwritten in the serialized output, not just de-referenced) ---
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    // --- Remove the Info dict reference from the trailer entirely.
    //     Do this AFTER the set* calls above — calling set* first rewrites the existing
    //     Info object's fields in-place, then we remove the trailer pointer so no Info
    //     dict is visible to PDF readers. Dates are intentionally not set to epoch
    //     (D:19700101) as that pattern is an identifiable fingerprint. ---
    if (pdfDoc.context?.trailerInfo?.Info) {
      delete pdfDoc.context.trailerInfo.Info;
    }

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
