// Copies the ffmpeg.wasm core from node_modules into public/ so it is served
// from our own origin. Without this, @ffmpeg/ffmpeg falls back to fetching the
// core from a third-party CDN at runtime, which breaks offline use.
// Runs automatically via the predev/prebuild npm scripts.
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const coreSrc = path.join(root, "node_modules", "@ffmpeg", "core", "dist", "esm");
const workerSrc = path.join(root, "node_modules", "@ffmpeg", "ffmpeg", "dist", "esm");
const dest = path.join(root, "public", "ffmpeg");

await mkdir(dest, { recursive: true });
for (const name of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  await copyFile(path.join(coreSrc, name), path.join(dest, name));
}
// The library's own worker must also be served unbundled (classWorkerURL):
// when the bundler processes it, the worker's dynamic import of the core URL
// gets rewritten and fails at runtime. const.js/errors.js are its imports.
for (const name of ["worker.js", "const.js", "errors.js"]) {
  await copyFile(path.join(workerSrc, name), path.join(dest, name));
}
console.log(`Copied ffmpeg core + worker to ${dest}`);
