export { MAX_FILE_COUNT, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES };

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  // Image
  "image/jpeg": [".jpeg", ".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],

  // Application
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],

  // Video
  "video/mp4": [".mp4"],
  "video/avi": [".avi"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-matroska": [".mkv"],

  // Audio
  "audio/wav": [".wav"],
  "audio/mpeg": [".mp3"],
  "audio/flac": [".flac"],
  "audio/aac": [".aac"],
  "audio/ogg": [".ogg"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a", ".mp4"],
  "audio/m4a": [".m4a"],
};
