import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = path.join(
  repositoryRoot,
  "tests",
  "privacy",
  "fixtures",
  "real",
  "webm",
  "chromium-mediarecorder-unknown-cluster.webm",
);

function readVint(bytes, offset, keepMarker) {
  if (offset >= bytes.length || bytes[offset] === 0) return null;
  const first = bytes[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 8 && !(first & marker)) {
    marker >>>= 1;
    length++;
  }
  if (length > 8 || offset + length > bytes.length) return null;
  let value = keepMarker ? first : first & (marker - 1);
  for (let index = 1; index < length; index++) value = value * 256 + bytes[offset + index];
  return {
    value,
    length,
    unknown: !keepMarker && value === 2 ** (7 * length) - 1,
  };
}

function readElement(bytes, offset, rangeEnd) {
  const id = readVint(bytes, offset, true);
  if (!id) return null;
  const size = readVint(bytes, offset + id.length, false);
  if (!size) return null;
  const payloadStart = offset + id.length + size.length;
  const payloadEnd = size.unknown ? rangeEnd : payloadStart + size.value;
  if (payloadEnd > rangeEnd || payloadEnd < payloadStart) return null;
  return { id: id.value, size, payloadStart, payloadEnd };
}

function inspectWebm(bytes) {
  const ID_EBML = 0x1a45dfa3;
  const ID_SEGMENT = 0x18538067;
  const ID_CLUSTER = 0x1f43b675;
  const header = readElement(bytes, 0, bytes.length);
  if (!header || header.id !== ID_EBML || header.size.unknown) throw new Error("Recording has no valid EBML header");
  const segment = readElement(bytes, header.payloadEnd, bytes.length);
  if (!segment || segment.id !== ID_SEGMENT) throw new Error("Recording has no Matroska Segment");

  let offset = segment.payloadStart;
  let clusterCount = 0;
  let unknownClusterCount = 0;
  while (offset < segment.payloadEnd) {
    const element = readElement(bytes, offset, segment.payloadEnd);
    if (!element) throw new Error(`Invalid Segment child at byte ${offset}`);
    if (element.id === ID_CLUSTER) {
      clusterCount++;
      if (element.size.unknown) unknownClusterCount++;
    }
    if (element.size.unknown) break;
    offset = element.payloadEnd;
  }
  return {
    segmentUnknownSize: segment.size.unknown,
    clusterCount,
    unknownClusterCount,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: !process.argv.includes("--headed") });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.setContent(`<!doctype html><html><body><canvas width="640" height="360"></canvas></body></html>`);
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.evaluate(async () => {
      const canvas = document.querySelector("canvas");
      const context = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mimeType = mimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      if (!mimeType) throw new Error("This Chromium build has no supported WebM MediaRecorder codec");

      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800_000 });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = () => reject(recorder.error ?? new Error("MediaRecorder failed"));
      });

      let frame = 0;
      let animationId;
      const draw = () => {
        const hue = (frame * 3) % 360;
        context.fillStyle = `hsl(${hue} 65% 20%)`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.font = "bold 30px system-ui";
        context.fillText("PrivMeta MediaRecorder fixture", 70, 80);
        context.font = "22px monospace";
        context.fillText(`Frame ${String(frame).padStart(4, "0")}`, 220, 320);
        context.fillStyle = `hsl(${(hue + 180) % 360} 90% 60%)`;
        context.beginPath();
        context.arc(80 + ((frame * 5) % 480), 190, 42, 0, Math.PI * 2);
        context.fill();
        frame++;
        animationId = requestAnimationFrame(draw);
      };
      draw();
      recorder.start(250);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      recorder.stop();
      await stopped;
      cancelAnimationFrame(animationId);
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(chunks, { type: mimeType });
      const link = document.createElement("a");
      link.download = "chromium-mediarecorder-unknown-cluster.webm";
      link.href = URL.createObjectURL(blob);
      document.body.append(link);
      link.click();
    });

    const download = await downloadPromise;
    const temporaryPath = await download.path();
    if (!temporaryPath) throw new Error("Chromium did not provide the recording download");
    const bytes = fs.readFileSync(temporaryPath);
    const inspection = inspectWebm(bytes);
    if (inspection.unknownClusterCount === 0) {
      throw new Error(`Chromium recording did not contain an unknown-size Cluster: ${JSON.stringify(inspection)}`);
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, bytes);
    console.log(`Created ${path.relative(repositoryRoot, outputPath)} (${bytes.length} bytes)`);
    console.log(JSON.stringify(inspection));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
