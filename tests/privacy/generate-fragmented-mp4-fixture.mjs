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
  "mp4",
  "chromium-mediarecorder-fragmented.mp4",
);

const SENTINELS = {
  title: "PRIVMETA_TEST_FRAGMENTED_TITLE",
  author: "PRIVMETA_TEST_FRAGMENTED_AUTHOR",
  comment: "PRIVMETA_TEST_FRAGMENTED_COMMENT",
  gps: "+51.5007-000.1246/",
};

function box(type, ...payloads) {
  const typeBytes = Buffer.isBuffer(type) ? type : Buffer.from(type, "latin1");
  const size = 8 + payloads.reduce((total, payload) => total + payload.length, 0);
  const result = Buffer.alloc(size);
  result.writeUInt32BE(size, 0);
  typeBytes.copy(result, 4);
  let offset = 8;
  for (const payload of payloads) {
    payload.copy(result, offset);
    offset += payload.length;
  }
  return result;
}

function uint32(value) {
  const result = Buffer.alloc(4);
  result.writeUInt32BE(value);
  return result;
}

function fullBox(type, ...payloads) {
  return box(type, Buffer.alloc(4), ...payloads);
}

function handler(type) {
  return fullBox("hdlr", Buffer.alloc(4), Buffer.from(type, "latin1"), Buffer.alloc(12));
}

function dataBox(value) {
  return box("data", uint32(1), Buffer.alloc(4), Buffer.from(value));
}

function item(type, value) {
  return box(type, dataBox(value));
}

function iTunesMetadata() {
  const itemList = box(
    "ilst",
    item(Buffer.from([0xa9, 0x6e, 0x61, 0x6d]), SENTINELS.title),
    item(Buffer.from([0xa9, 0x41, 0x52, 0x54]), SENTINELS.author),
    item(Buffer.from([0xa9, 0x63, 0x6d, 0x74]), SENTINELS.comment),
  );
  return box("udta", fullBox("meta", handler("mdir"), itemList));
}

function keyedGpsMetadata() {
  const key = Buffer.from("com.apple.quicktime.location.ISO6709");
  const keyEntry = Buffer.concat([uint32(8 + key.length), Buffer.from("mdta"), key]);
  const keys = fullBox("keys", uint32(1), keyEntry);
  const itemList = box("ilst", item(uint32(1), SENTINELS.gps));
  return fullBox("meta", handler("mdta"), keys, itemList);
}

function readTopLevelBoxes(bytes) {
  const boxes = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error(`Truncated MP4 box at byte ${offset}`);
    let size = bytes.readUInt32BE(offset);
    let headerLength = 8;
    if (size === 1) {
      if (offset + 16 > bytes.length) throw new Error(`Truncated large MP4 box at byte ${offset}`);
      size = Number(bytes.readBigUInt64BE(offset + 8));
      headerLength = 16;
    } else if (size === 0) {
      size = bytes.length - offset;
    }
    if (size < headerLength || offset + size > bytes.length) throw new Error(`Invalid MP4 box at byte ${offset}`);
    boxes.push({ offset, size, type: bytes.toString("latin1", offset + 4, offset + 8) });
    offset += size;
  }
  return boxes;
}

function addPrivacyMetadata(recording) {
  const boxes = readTopLevelBoxes(recording);
  const moov = boxes.find((candidate) => candidate.type === "moov");
  if (!moov) throw new Error("Chromium recording has no moov box");
  const metadata = Buffer.concat([iTunesMetadata(), keyedGpsMetadata()]);
  const insertionPoint = moov.offset + moov.size;
  const result = Buffer.concat([
    recording.subarray(0, insertionPoint),
    metadata,
    recording.subarray(insertionPoint),
  ]);
  result.writeUInt32BE(moov.size + metadata.length, moov.offset);
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: !process.argv.includes("--headed") });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.setContent('<!doctype html><html><body><canvas width="640" height="360"></canvas></body></html>');
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.evaluate(async () => {
      const canvas = document.querySelector("canvas");
      const context = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      const mimeTypes = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4"];
      const mimeType = mimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      if (!mimeType) throw new Error("This Chromium build has no supported MP4 MediaRecorder codec");

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
        context.fillText("PrivMeta fragmented MP4 fixture", 70, 80);
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

      const link = document.createElement("a");
      link.download = "chromium-mediarecorder-fragmented.mp4";
      link.href = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
      document.body.append(link);
      link.click();
    });

    const download = await downloadPromise;
    const temporaryPath = await download.path();
    if (!temporaryPath) throw new Error("Chromium did not provide the recording download");
    const bytes = addPrivacyMetadata(fs.readFileSync(temporaryPath));
    const boxes = readTopLevelBoxes(bytes);
    const fragmentCount = boxes.filter((candidate) => candidate.type === "moof").length;
    if (fragmentCount === 0) throw new Error("Chromium MP4 recording was not fragmented");
    for (const sentinel of Object.values(SENTINELS)) {
      if (!bytes.includes(Buffer.from(sentinel))) throw new Error(`Generated MP4 is missing ${sentinel}`);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, bytes);
    fs.writeFileSync(
      `${outputPath}.privacy.json`,
      `${JSON.stringify({
        requiredBefore: ["*:Title", "*:Artist", "*:Comment"],
        preserveTags: ["FileType", "Duration", "ImageSize", "CompressorID", "Rotation"],
        sentinels: Object.values(SENTINELS),
        notes: "Generated Chromium MediaRecorder fragmented MP4 with synthetic privacy metadata.",
      }, null, 2)}\n`,
    );
    console.log(`Created ${path.relative(repositoryRoot, outputPath)} (${bytes.length} bytes, ${fragmentCount} fragments)`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
