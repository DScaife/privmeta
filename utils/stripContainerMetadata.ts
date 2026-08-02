import { stripIsobmffMetadata } from "./stripIsobmffMetadata";
import { stripMatroskaMetadata } from "./stripMatroskaMetadata";
import { stripMp3Metadata, stripAacMetadata } from "./stripId3Metadata";
import { stripFlacMetadata } from "./stripFlacMetadata";
import { stripRiffMetadata } from "./stripRiffMetadata";

const EXTENSION_HANDLERS: Record<string, (file: File) => Promise<File | null>> = {
  mp4: stripIsobmffMetadata,
  mov: stripIsobmffMetadata,
  m4a: stripIsobmffMetadata,
  webm: stripMatroskaMetadata,
  mkv: stripMatroskaMetadata,
  mp3: stripMp3Metadata,
  aac: stripAacMetadata,
  flac: stripFlacMetadata,
  wav: stripRiffMetadata,
};

/** Routes an audio/video file to its container-format-specific metadata stripper. */
export async function stripContainerMetadata(file: File): Promise<File | null> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const handler = extension ? EXTENSION_HANDLERS[extension] : undefined;
  if (!handler) {
    console.error("Unsupported format for container metadata stripping");
    return null;
  }
  try {
    return await handler(file);
  } catch (err) {
    console.error("Container metadata stripping failed:", err);
    return null;
  }
}
