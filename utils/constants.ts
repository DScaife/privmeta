export { MAX_FILE_COUNT, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES };
export type { FileKind };

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
