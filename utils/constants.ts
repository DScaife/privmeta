export {
  MAX_FILE_COUNT,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_FILE_SIZE_MB,
  MAX_TOTAL_FILE_SIZE_BYTES,
  ACCEPTED_FILE_TYPES,
  getKindForFilename,
  getTotalFileSizeBytes,
};
export type { FileKind };

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
// Cleaned files and the final ZIP can coexist in memory. Bounding the whole
// queue prevents a batch of individually valid files from exhausting a tab.
const MAX_TOTAL_FILE_SIZE_MB = 100;
const MAX_TOTAL_FILE_SIZE_BYTES = MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024;

function getTotalFileSizeBytes(files: readonly Pick<File, "size">[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/** Which stripping pipeline handles the file. "container" covers audio and video. */
type FileKind = "jpeg" | "image" | "gif" | "pdf" | "docx" | "container";

const ACCEPTED_FILE_TYPES: Record<string, { extensions: string[]; kind: FileKind }> = {
  // Image
  "image/jpeg": { extensions: [".jpeg", ".jpg"], kind: "jpeg" },
  "image/png": { extensions: [".png"], kind: "image" },
  "image/webp": { extensions: [".webp"], kind: "image" },
  // GIF gets lossless block-level stripping - re-encoding (canvas or ffmpeg)
  // would flatten the animation or dither the palette
  "image/gif": { extensions: [".gif"], kind: "gif" },

  // Application
  "application/pdf": { extensions: [".pdf"], kind: "pdf" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extensions: [".docx"], kind: "docx" },

  // Video
  "video/mp4": { extensions: [".mp4"], kind: "container" },
  "video/webm": { extensions: [".webm"], kind: "container" },
  "video/quicktime": { extensions: [".mov"], kind: "container" },
  "video/x-matroska": { extensions: [".mkv"], kind: "container" },

  // Audio
  "audio/wav": { extensions: [".wav"], kind: "container" },
  "audio/mpeg": { extensions: [".mp3"], kind: "container" },
  "audio/flac": { extensions: [".flac"], kind: "container" },
  "audio/aac": { extensions: [".aac"], kind: "container" },
  "audio/mp4": { extensions: [".m4a"], kind: "container" },
  "audio/x-m4a": { extensions: [".m4a", ".mp4"], kind: "container" },
  "audio/m4a": { extensions: [".m4a"], kind: "container" },
};

// Browser-reported MIME types for less-standardized formats are unreliable
// (e.g. Chrome reports .mkv as "video/matroska", not the "video/x-matroska"
// key above) - file identity is validated by extension instead, which is
// unambiguous regardless of browser/OS MIME sniffing quirks.
const EXTENSION_TO_KIND: Record<string, FileKind> = {};
for (const { extensions, kind } of Object.values(ACCEPTED_FILE_TYPES)) {
  for (const ext of extensions) {
    EXTENSION_TO_KIND[ext.toLowerCase()] = kind;
  }
}

function getKindForFilename(filename: string): FileKind | undefined {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return undefined;
  return EXTENSION_TO_KIND[filename.slice(dotIndex).toLowerCase()];
}
