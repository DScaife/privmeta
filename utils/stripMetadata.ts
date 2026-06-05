import { PDFDocument, PDFName } from "pdf-lib";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import piexif from "piexifjs";

// ─── Report types ─────────────────────────────────────────────────────────────

export type MetadataField = {
  label: string;
  value?: string;
  why: string;
};

export type MetadataCategory = {
  name: string;
  emoji: string;
  summary: string;
  fields: MetadataField[];
};

export type FileStrippedReport = {
  fileName: string;
  mimeType: string;
  categories: MetadataCategory[];
};

// ─── EXIF decode helpers ──────────────────────────────────────────────────────

function bytesToStr(bytes: number[] | undefined): string | undefined {
  if (!bytes?.length) return undefined;
  const s = bytes
    .filter((b) => b !== 0)
    .map((b) => String.fromCharCode(b))
    .join("")
    .trim();
  return s || undefined;
}

function gpsRatsToDeg(rats: Array<[number, number]> | undefined): number | undefined {
  if (!rats || rats.length < 3) return undefined;
  const d = rats[0][1] ? rats[0][0] / rats[0][1] : 0;
  const m = rats[1][1] ? rats[1][0] / rats[1][1] : 0;
  const s = rats[2][1] ? rats[2][0] / rats[2][1] : 0;
  return d + m / 60 + s / 3600;
}

function ratToNum(rat: [number, number] | undefined): number | undefined {
  if (!rat || !rat[1]) return undefined;
  return rat[0] / rat[1];
}

// ─── Report builders ──────────────────────────────────────────────────────────

function buildJpegReport(exif: Record<string, Record<number, unknown>>, fileName: string): FileStrippedReport {
  const categories: MetadataCategory[] = [];
  const gps = exif["GPS"] ?? {};
  const ifd0 = exif["0th"] ?? {};
  const exifIfd = exif["Exif"] ?? {};

  // Location
  const latRats = gps[2] as Array<[number, number]> | undefined;
  const lonRats = gps[4] as Array<[number, number]> | undefined;
  if (latRats && lonRats) {
    const latRef = bytesToStr(gps[1] as number[]) ?? "N";
    const lonRef = bytesToStr(gps[3] as number[]) ?? "E";
    const lat = gpsRatsToDeg(latRats);
    const lon = gpsRatsToDeg(lonRats);
    const altRat = gps[6] as [number, number] | undefined;
    const altRef = gps[5] as number | undefined;
    const dateStamp = bytesToStr(gps[29] as number[]);
    const fields: MetadataField[] = [];
    if (lat !== undefined && lon !== undefined) {
      fields.push({
        label: "GPS Coordinates",
        value: `${(lat * (latRef === "S" ? -1 : 1)).toFixed(6)}° ${latRef}, ${(lon * (lonRef === "W" ? -1 : 1)).toFixed(6)}° ${lonRef}`,
        why: "This pinpoints exactly where you were when the photo was taken — down to street-address level.",
      });
    }
    const alt = ratToNum(altRat);
    if (alt !== undefined) {
      fields.push({
        label: "Altitude",
        value: `${alt.toFixed(0)} m ${altRef === 1 ? "below" : "above"} sea level`,
        why: "Even your elevation at the time of capture was logged.",
      });
    }
    if (dateStamp) {
      fields.push({
        label: "GPS Date",
        value: dateStamp,
        why: "The date your device's GPS chip recorded alongside the coordinates.",
      });
    }
    categories.push({
      name: "Location",
      emoji: "📍",
      summary:
        "GPS coordinates were baked into this file. Anyone with a basic EXIF viewer could open this photo and see a map pin showing exactly where you were.",
      fields,
    });
  }

  // Device & camera
  const make = bytesToStr(ifd0[271] as number[]);
  const model = bytesToStr(ifd0[272] as number[]);
  const lensModel = bytesToStr(exifIfd[42036] as number[]);
  const iso = exifIfd[34855] as number | undefined;
  const expRat = exifIfd[33434] as [number, number] | undefined;
  const fnRat = exifIfd[33437] as [number, number] | undefined;
  const flRat = exifIfd[37386] as [number, number] | undefined;
  const deviceFields: MetadataField[] = [];
  if (make || model)
    deviceFields.push({
      label: "Device",
      value: [make, model].filter(Boolean).join(" "),
      why: "Reveals the exact camera or phone model you used — a detail that can link photos back to you.",
    });
  if (lensModel)
    deviceFields.push({
      label: "Lens",
      value: lensModel,
      why: "The specific lens assembly — can narrow down to a specific device variant.",
    });
  if (iso !== undefined)
    deviceFields.push({
      label: "ISO Speed",
      value: `ISO ${iso}`,
      why: "The sensor sensitivity — hints at the lighting conditions when you took the photo.",
    });
  const exp = ratToNum(expRat);
  if (exp !== undefined)
    deviceFields.push({
      label: "Shutter Speed",
      value: exp < 1 ? `1/${Math.round(1 / exp)}s` : `${exp}s`,
      why: "How long the camera shutter was open.",
    });
  const fn = ratToNum(fnRat);
  if (fn !== undefined)
    deviceFields.push({ label: "Aperture", value: `f/${fn.toFixed(1)}`, why: "The lens aperture at time of capture." });
  const fl = ratToNum(flRat);
  if (fl !== undefined)
    deviceFields.push({ label: "Focal Length", value: `${fl.toFixed(0)} mm`, why: "How much the shot was zoomed in." });
  if (deviceFields.length > 0)
    categories.push({
      name: "Device & Camera",
      emoji: "📷",
      summary: "Technical details about the hardware used to take this photo were stored in the file.",
      fields: deviceFields,
    });

  // Date & time
  const dt = bytesToStr(ifd0[306] as number[]);
  const dtOrig = bytesToStr(exifIfd[36867] as number[]);
  const dtDigi = bytesToStr(exifIfd[36868] as number[]);
  const dateFields: MetadataField[] = [];
  if (dtOrig || dt)
    dateFields.push({
      label: "Date & Time Taken",
      value: dtOrig ?? dt,
      why: "The precise moment this photo was captured. Combined with GPS, this can reconstruct your exact movements.",
    });
  if (dtDigi && dtDigi !== dtOrig)
    dateFields.push({
      label: "Date Digitized",
      value: dtDigi,
      why: "When the image data was stored to the device — usually the same as capture time but not always.",
    });
  if (dateFields.length > 0)
    categories.push({
      name: "Date & Time",
      emoji: "🕐",
      summary: "Exact timestamps reveal when — and combined with GPS, where — you were when you took this photo.",
      fields: dateFields,
    });

  // Identity
  const artist = bytesToStr(ifd0[315] as number[]);
  const copyright = bytesToStr(ifd0[33432] as number[]);
  const imageDesc = bytesToStr(ifd0[270] as number[]);
  const userComment = exifIfd[37510] as number[] | undefined;
  const commentStr = userComment && userComment.length > 8 ? bytesToStr(userComment.slice(8)) : undefined;
  const identFields: MetadataField[] = [];
  if (artist) identFields.push({ label: "Author", value: artist, why: "Your name, as set by your camera or photo app." });
  if (copyright) identFields.push({ label: "Copyright", value: copyright, why: "An ownership or copyright notice embedded in the file." });
  if (imageDesc) identFields.push({ label: "Description", value: imageDesc, why: "A caption or description added to this image." });
  if (commentStr) identFields.push({ label: "Comment", value: commentStr, why: "A personal note embedded in the image data." });
  if (identFields.length > 0)
    categories.push({
      name: "Identity",
      emoji: "🪪",
      summary: "Personal details linked to you were found embedded in this image.",
      fields: identFields,
    });

  // Software
  const software = bytesToStr(ifd0[305] as number[]);
  if (software)
    categories.push({
      name: "Software",
      emoji: "💻",
      summary: "The application that created or last processed this file was recorded — this can fingerprint your editing workflow.",
      fields: [{ label: "Software", value: software, why: "Identifies which app exported or edited this photo." }],
    });

  if (categories.length === 0) {
    categories.push({
      name: "No significant personal metadata found",
      emoji: "✅",
      summary:
        "No personal GPS, identity, or device data was detected in this file. Standard structural EXIF fields were still sanitized to ensure a clean output.",
      fields: [],
    });
  }

  return { fileName, mimeType: "image/jpeg", categories };
}

function buildGenericImageReport(fileName: string, mimeType: string): FileStrippedReport {
  return {
    fileName,
    mimeType,
    categories: [
      {
        name: "Embedded Metadata",
        emoji: "🖼️",
        summary:
          "The image was run through a clean canvas re-encode, which strips all non-pixel data. This removes any text chunks, XMP tags, ICC color profiles, or other metadata blocks the original file may have carried.",
        fields: [
          {
            label: "XMP / IPTC data",
            why: "Structured metadata like titles, authors, keywords, and copyright notices that photo apps and cameras embed.",
          },
          {
            label: "ICC color profile",
            why: "Color calibration data that can hint at the type of device or display used to create the image.",
          },
          {
            label: "Text / comment chunks",
            why: "Free-text fields some apps use to store notes, software version strings, or custom identifiers.",
          },
        ],
      },
    ],
  };
}

function buildPdfReport(
  title: string | undefined,
  author: string | undefined,
  subject: string | undefined,
  keywords: string[] | undefined,
  producer: string | undefined,
  creator: string | undefined,
  fileName: string
): FileStrippedReport {
  const categories: MetadataCategory[] = [];

  const docFields: MetadataField[] = [];
  if (title) docFields.push({ label: "Title", value: title, why: "The document title, readable by anyone who checks its properties." });
  if (author) docFields.push({ label: "Author", value: author, why: "Your name as recorded by the app when you created the document." });
  if (subject) docFields.push({ label: "Subject", value: subject, why: "A summary of the document topic." });
  if (keywords?.length)
    docFields.push({
      label: "Keywords",
      value: keywords.join(", "),
      why: "Tags that describe the content — useful for search, but also reveals what the document is about.",
    });
  if (docFields.length > 0)
    categories.push({
      name: "Document Info",
      emoji: "📄",
      summary: "Descriptive properties embedded in the PDF's info dictionary were found and cleared.",
      fields: docFields,
    });

  const swFields: MetadataField[] = [];
  if (creator)
    swFields.push({
      label: "Created with",
      value: creator,
      why: "The app that originally authored this PDF — e.g. Microsoft Word, Google Docs, Adobe Acrobat.",
    });
  if (producer)
    swFields.push({
      label: "Exported with",
      value: producer,
      why: "The library or app that generated the final PDF bytes — can reveal the exact software version used.",
    });
  if (swFields.length > 0)
    categories.push({
      name: "Software",
      emoji: "💻",
      summary: "Details about the tools used to create this PDF were embedded in the file.",
      fields: swFields,
    });

  categories.push({
    name: "Timestamps",
    emoji: "🕐",
    summary:
      "PDFs store both a creation date and a last-modified date. These timestamps reveal when you worked on the document and can help piece together a timeline of your activity.",
    fields: [
      { label: "Creation date", why: "When this PDF was originally generated." },
      { label: "Last-modified date", why: "The most recent time this file was changed or resaved." },
    ],
  });

  categories.push({
    name: "XMP Metadata Stream",
    emoji: "🗄️",
    summary:
      "PDFs often contain a hidden XMP stream — a block of embedded XML that can describe the document's full history, rights management data, and app-specific information. This entire block was removed.",
    fields: [
      {
        label: "Document history & revision info",
        why: "A record of how many times the document was edited and with what tools.",
      },
      {
        label: "Rights management data",
        why: "Copyright and usage license information embedded by professional publishing apps.",
      },
    ],
  });

  return { fileName, mimeType: "application/pdf", categories };
}

function buildDocxReport(coreXml: string | undefined, appXml: string | undefined, fileName: string): FileStrippedReport {
  const categories: MetadataCategory[] = [];

  if (coreXml && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(coreXml, "application/xml");
    const get = (tag: string) => doc.querySelector(tag)?.textContent?.trim() || undefined;

    const creator = get("creator");
    const lastModBy = get("lastModifiedBy");
    const revision = get("revision");
    const created = get("created");
    const modified = get("modified");
    const title = get("title");
    const subject = get("subject");
    const keywords = get("keywords");
    const description = get("description");

    const docFields: MetadataField[] = [];
    if (title) docFields.push({ label: "Title", value: title, why: "The document title set in its properties panel." });
    if (subject) docFields.push({ label: "Subject", value: subject, why: "A subject field embedded in the document's core metadata." });
    if (description) docFields.push({ label: "Description", value: description, why: "A description stored alongside the document." });
    if (keywords) docFields.push({ label: "Keywords", value: keywords, why: "Tags embedded for search indexing purposes." });
    if (docFields.length > 0)
      categories.push({
        name: "Document Properties",
        emoji: "📄",
        summary: "Descriptive metadata stored in the document's core properties was found and removed.",
        fields: docFields,
      });

    const identFields: MetadataField[] = [];
    if (creator)
      identFields.push({
        label: "Created by",
        value: creator,
        why: "The account name of the person who first created this file — often your full name.",
      });
    if (lastModBy)
      identFields.push({
        label: "Last edited by",
        value: lastModBy,
        why: "The name of the last person to save this document — a chain of editors is tracked here.",
      });
    if (revision)
      identFields.push({
        label: "Revision number",
        value: `${revision} saves`,
        why: `This document was saved ${revision} times. Even your work habits can be inferred from a high save count.`,
      });
    if (identFields.length > 0)
      categories.push({
        name: "Identity",
        emoji: "🪪",
        summary: "Your name and editing history were woven into this document's hidden properties.",
        fields: identFields,
      });

    const dateFields: MetadataField[] = [];
    if (created) dateFields.push({ label: "Created", value: created, why: "The exact date and time this document was first created." });
    if (modified) dateFields.push({ label: "Last modified", value: modified, why: "When this document was most recently saved." });
    if (dateFields.length > 0)
      categories.push({
        name: "Timestamps",
        emoji: "🕐",
        summary: "Editing history dates were stored in the file — enough to reconstruct when you worked on this document.",
        fields: dateFields,
      });
  }

  if (appXml && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(appXml, "application/xml");
    const get = (tag: string) => doc.querySelector(tag)?.textContent?.trim() || undefined;
    const application = get("Application");
    const company = get("Company");
    const appVersion = get("AppVersion");
    const swFields: MetadataField[] = [];
    if (application)
      swFields.push({ label: "Application", value: application, why: "The software used to create or edit this document." });
    if (company)
      swFields.push({
        label: "Company",
        value: company,
        why: "Your organization name, as configured in the app's account settings — often auto-filled without you realizing it.",
      });
    if (appVersion)
      swFields.push({
        label: "Version",
        value: appVersion,
        why: "The exact version number of the application — can reveal whether you are running outdated software.",
      });
    if (swFields.length > 0)
      categories.push({
        name: "Software & Organization",
        emoji: "💻",
        summary: "Details about the app and organization linked to the author were embedded in the document.",
        fields: swFields,
      });
  }

  if (categories.length === 0) {
    categories.push({
      name: "Document Properties Removed",
      emoji: "📄",
      summary:
        "Standard Word document metadata files (docProps/core.xml and docProps/app.xml) were found and removed. These files typically contain the author's name, organization, editing history, and application details.",
      fields: [
        {
          label: "Author & editor names",
          why: "Full names of anyone who created or edited the file are stored here by default.",
        },
        {
          label: "Creation & modification dates",
          why: "A complete timeline of when the file was worked on.",
        },
        {
          label: "Company & software info",
          why: "Your organization name and app version, auto-populated from the author's machine settings.",
        },
      ],
    });
  }

  return { fileName, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", categories };
}

function buildAudioReport(fileName: string, mimeType: string): FileStrippedReport {
  return {
    fileName,
    mimeType,
    categories: [
      {
        name: "Audio Tags",
        emoji: "🎵",
        summary:
          "Audio files carry structured tag blocks — ID3 for MP3, Vorbis Comments for OGG/FLAC, and similar formats for others. These can contain a surprising amount of personal or identifying information beyond just song titles.",
        fields: [
          {
            label: "Title, Artist, Album",
            why: "Basic identification tags — also reveal your listening or recording habits.",
          },
          { label: "Year & Genre", why: "Classification fields embedded by the encoding app." },
          {
            label: "Comments & Lyrics",
            why: "Free-text fields that can hold personal notes, contact info, or original lyrics.",
          },
          {
            label: "Cover Art",
            why: "Embedded artwork is itself a file-within-a-file, and can contain its own metadata.",
          },
          {
            label: "Encoder info",
            why: "The software name and version used to encode the audio — acts like a digital fingerprint for the source.",
          },
        ],
      },
    ],
  };
}

function buildVideoReport(fileName: string, mimeType: string): FileStrippedReport {
  return {
    fileName,
    mimeType,
    categories: [
      {
        name: "Video Container Tags",
        emoji: "🎬",
        summary:
          "Video files store metadata in their container layer — a section separate from the actual video and audio streams. This hidden layer can carry details that uniquely identify the recording device and its owner.",
        fields: [
          {
            label: "Title & Author",
            why: "Labels set by the recording app — often auto-populated from your device name or account.",
          },
          {
            label: "Creation & modification dates",
            why: "Precise timestamps of when the video was recorded or re-exported.",
          },
          {
            label: "GPS location",
            why: "Some phones embed your location into video files just as they do with photos.",
          },
          {
            label: "Encoder & device info",
            why: "The recording app, codec, and firmware version — can identify the device make, model, and software version.",
          },
          {
            label: "Comment & tag fields",
            why: "Open-ended fields that apps use to store custom metadata or processing notes.",
          },
        ],
      },
    ],
  };
}

// ─── FFmpeg singleton ─────────────────────────────────────────────────────────

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load();
  }
  return ffmpegInstance;
}

// ─── Core canvas strip (PNG, WebP, GIF, etc.) ────────────────────────────────

async function stripImageCore(file: File): Promise<File | null> {
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
        resolve(new File([blob], file.name, { type: file.type }));
        URL.revokeObjectURL(url);
      }, file.type);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ─── Exported strip functions ─────────────────────────────────────────────────

export async function stripJpegMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read JPEG as data URL"));
      };
      reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
      reader.readAsDataURL(file);
    });

    let exif: Record<string, Record<number, unknown>> = {};
    try {
      exif = piexif.load(dataUrl) as Record<string, Record<number, unknown>>;
    } catch {
      // No EXIF data — continue with empty report
    }
    const report = buildJpegReport(exif, file.name);

    try {
      const cleanedUrl = piexif.remove(dataUrl);
      const blob = await (await fetch(cleanedUrl)).blob();
      return { file: new File([blob], file.name, { type: "image/jpeg" }), report };
    } catch (err) {
      console.error("piexif.remove failed, falling back to canvas re-encode:", err);
      return { file: await stripImageCore(file), report };
    }
  } catch (err) {
    console.error("JPEG strip failed:", err);
    return { file: null, report: buildGenericImageReport(file.name, file.type) };
  }
}

export async function stripImageMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  return { file: await stripImageCore(file), report: buildGenericImageReport(file.name, file.type) };
}

export async function stripPdfMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

    const title = pdfDoc.getTitle() || undefined;
    const author = pdfDoc.getAuthor() || undefined;
    const subject = pdfDoc.getSubject() || undefined;
    const kwRaw = pdfDoc.getKeywords();
    const keywords = kwRaw ? kwRaw.split(/[,;]/).map((k) => k.trim()).filter(Boolean) : undefined;
    const producer = pdfDoc.getProducer() || undefined;
    const creator = pdfDoc.getCreator() || undefined;
    const report = buildPdfReport(title, author, subject, keywords, producer, creator, file.name);

    const metaKey = PDFName.of("Metadata");
    if (pdfDoc.catalog.get(metaKey)) pdfDoc.catalog.delete(metaKey);
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    if (pdfDoc.context?.trailerInfo?.Info) delete pdfDoc.context.trailerInfo.Info;

    const bytes = await pdfDoc.save({ useObjectStreams: false });
    return { file: new File([bytes as BlobPart], file.name, { type: "application/pdf" }), report };
  } catch (err) {
    console.error("PDF strip failed:", err);
    return {
      file: null,
      report: buildPdfReport(undefined, undefined, undefined, undefined, undefined, undefined, file.name),
    };
  }
}

export async function stripDocxMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  try {
    if (!file.name.endsWith(".docx")) throw new Error("Only .docx files are supported.");
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(file);
    if (!zip.file("word/document.xml")) throw new Error("Invalid DOCX structure.");

    const coreXml = await zip.file("docProps/core.xml")?.async("string");
    const appXml = await zip.file("docProps/app.xml")?.async("string");
    const report = buildDocxReport(coreXml, appXml, file.name);

    for (const path of ["docProps/core.xml", "docProps/app.xml", "docProps/custom.xml"]) {
      if (zip.file(path)) zip.remove(path);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    return {
      file: new File([blob], file.name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      report,
    };
  } catch (err) {
    console.error(`DOCX strip failed (${file.name}):`, err);
    return { file: null, report: buildDocxReport(undefined, undefined, file.name) };
  }
}

export async function stripVideoMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  const report = buildVideoReport(file.name, file.type);
  try {
    if (typeof window === "undefined") return { file: null, report };
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) throw new Error("Unsupported video format");
    const inFile = `input.${ext}`;
    const outFile = `output.${ext}`;
    const mime = file.type || `video/${ext}`;
    await ffmpeg.writeFile(inFile, await fetchFile(file));
    await ffmpeg.exec(["-i", inFile, "-map_metadata", "-1", "-metadata", "encoder=", "-c", "copy", outFile]);
    const data = await ffmpeg.readFile(outFile);
    const blob = new Blob([data as BlobPart], { type: mime });
    return {
      file: new File([blob], file.name.replace(/\.[^.]+$/, `_cleaned.${ext}`), { type: mime }),
      report,
    };
  } catch (err) {
    console.error("Video strip failed:", err);
    return { file: null, report };
  }
}

export async function stripAudioMetadata(file: File): Promise<{ file: File | null; report: FileStrippedReport }> {
  const report = buildAudioReport(file.name, file.type);
  try {
    if (typeof window === "undefined") return { file: null, report };
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const supported = ["wav", "mp3", "flac", "aac", "ogg", "m4a"];
    if (!ext || !supported.includes(ext)) throw new Error("Unsupported audio format");
    const inFile = `input.${ext}`;
    const outFile = `output.${ext}`;
    const mime = file.type || `audio/${ext}`;
    await ffmpeg.writeFile(inFile, await fetchFile(file));
    await ffmpeg.exec(["-i", inFile, "-map_metadata", "-1", "-metadata", "encoder=", "-c", "copy", outFile]);
    const data = await ffmpeg.readFile(outFile);
    const blob = new Blob([data as BlobPart], { type: mime });
    return {
      file: new File([blob], file.name.replace(/\.[^.]+$/, `_cleaned.${ext}`), { type: mime }),
      report,
    };
  } catch (err) {
    console.error("Audio strip failed:", err);
    return { file: null, report };
  }
}