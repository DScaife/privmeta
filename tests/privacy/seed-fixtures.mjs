import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = path.join(repositoryRoot, "tests", "privacy", "fixtures", "synthetic");
const SENTINELS = {
  author: "PRIVMETA_TEST_AUTHOR",
  title: "PRIVMETA_TEST_TITLE",
  comment: "PRIVMETA_TEST_COMMENT",
  software: "PRIVMETA_TEST_SOFTWARE",
  location: "PRIVMETA_TEST_LOCATION",
  company: "PRIVMETA_TEST_COMPANY",
};

function resolveExifTool() {
  const candidates = [
    process.env.EXIFTOOL_PATH,
    process.platform === "win32" ? "C:\\Users\\scaif\\AppData\\Local\\Programs\\ExifTool\\exiftool.exe" : undefined,
    "exiftool",
  ].filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-ver"], { encoding: "utf8", windowsHide: true });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error("ExifTool was not found. Install it or set EXIFTOOL_PATH before running privacy:seed.");
}

function runExifTool(executable, filePath, assignments) {
  const sentinelValues = [...new Set(assignments.map(([, value]) => value).filter((value) => value.startsWith("PRIVMETA_TEST_")))];
  const existing = fs.readFileSync(filePath);
  if (sentinelValues.length > 0 && sentinelValues.every((value) => existing.includes(Buffer.from(value)))) return;
  const args = ["-overwrite_original", ...assignments.map(([tag, value]) => `-${tag}=${value}`), filePath];
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 || !/1 image files updated/.test(result.stdout)) {
    throw new Error(`ExifTool could not seed ${filePath}:\n${result.stdout}\n${result.stderr}`);
  }
}

function filesFor(extension) {
  const directory = path.join(fixtureRoot, extension);
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith(".") && !entry.name.endsWith(".privacy.json"))
    .map((entry) => path.join(directory, entry.name));
}

function writeSidecar(filePath, requiredBefore, notes) {
  fs.writeFileSync(
    `${filePath}.privacy.json`,
    `${JSON.stringify({ requiredBefore, sentinels: Object.values(SENTINELS), notes }, null, 2)}\n`,
  );
}

function uint32BE(value) {
  const output = Buffer.alloc(4);
  output.writeUInt32BE(value);
  return output;
}

function uint32LE(value) {
  const output = Buffer.alloc(4);
  output.writeUInt32LE(value);
  return output;
}

function syncsafe(value) {
  return Buffer.from([(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f]);
}

function textFrame(id, value) {
  const payload = Buffer.concat([Buffer.from([0]), Buffer.from(value, "latin1")]);
  return Buffer.concat([Buffer.from(id, "ascii"), uint32BE(payload.length), Buffer.alloc(2), payload]);
}

function commentFrame(value) {
  const payload = Buffer.concat([Buffer.from([0]), Buffer.from("eng", "ascii"), Buffer.from([0]), Buffer.from(value, "latin1")]);
  return Buffer.concat([Buffer.from("COMM", "ascii"), uint32BE(payload.length), Buffer.alloc(2), payload]);
}

function stripLeadingId3(bytes) {
  if (bytes.length < 10 || bytes.subarray(0, 3).toString("ascii") !== "ID3") return bytes;
  const size = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
  const footer = bytes[5] & 0x10 ? 10 : 0;
  const end = 10 + size + footer;
  if (end > bytes.length) throw new Error("Existing ID3 tag exceeds fixture length");
  return bytes.subarray(end);
}

function seedId3(filePath) {
  const frames = Buffer.concat([
    textFrame("TPE1", SENTINELS.author),
    textFrame("TIT2", SENTINELS.title),
    textFrame("TENC", SENTINELS.software),
    commentFrame(SENTINELS.comment),
  ]);
  const tag = Buffer.concat([Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]), syncsafe(frames.length), frames]);
  fs.writeFileSync(filePath, Buffer.concat([tag, stripLeadingId3(fs.readFileSync(filePath))]));
}

function flacBlock(type, payload) {
  if (payload.length > 0xffffff) throw new Error("FLAC seed block is too large");
  return Buffer.concat([Buffer.from([type, payload.length >>> 16, payload.length >>> 8, payload.length]), payload]);
}

function seedFlac(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.subarray(0, 4).toString("ascii") !== "fLaC") throw new Error(`Not a FLAC file: ${filePath}`);
  const kept = [];
  let offset = 4;
  while (true) {
    if (offset + 4 > bytes.length) throw new Error(`Malformed FLAC metadata: ${filePath}`);
    const header = bytes[offset];
    const type = header & 0x7f;
    const size = bytes.readUIntBE(offset + 1, 3);
    const end = offset + 4 + size;
    if (end > bytes.length) throw new Error(`Malformed FLAC block: ${filePath}`);
    if (type !== 4 && type !== 6) kept.push({ type, payload: bytes.subarray(offset + 4, end) });
    offset = end;
    if (header & 0x80) break;
  }
  const vendor = Buffer.from(SENTINELS.software, "utf8");
  const comments = [
    `ARTIST=${SENTINELS.author}`,
    `TITLE=${SENTINELS.title}`,
    `COMMENT=${SENTINELS.comment}`,
  ].map((value) => Buffer.from(value, "utf8"));
  const payload = Buffer.concat([
    uint32LE(vendor.length), vendor, uint32LE(comments.length),
    ...comments.flatMap((comment) => [uint32LE(comment.length), comment]),
  ]);
  kept.splice(1, 0, { type: 4, payload });
  const blocks = kept.map((block, index) => {
    const encoded = flacBlock(block.type, block.payload);
    if (index === kept.length - 1) encoded[0] |= 0x80;
    return encoded;
  });
  fs.writeFileSync(filePath, Buffer.concat([Buffer.from("fLaC"), ...blocks, bytes.subarray(offset)]));
}

function riffChunk(id, payload) {
  const padding = payload.length & 1 ? Buffer.from([0]) : Buffer.alloc(0);
  return Buffer.concat([Buffer.from(id, "ascii"), uint32LE(payload.length), payload, padding]);
}

function seedWav(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WAVE") {
    throw new Error(`Not a RIFF/WAVE file: ${filePath}`);
  }
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = bytes.subarray(offset, offset + 4).toString("ascii");
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size & 1);
    if (end > bytes.length) throw new Error(`Malformed WAVE chunk: ${filePath}`);
    const isInfo = id === "LIST" && bytes.subarray(offset + 8, offset + 12).toString("ascii") === "INFO";
    if (!isInfo && id.toLowerCase() !== "id3 ") chunks.push(bytes.subarray(offset, end));
    offset = end;
  }
  if (offset !== bytes.length) throw new Error(`Unexpected trailing WAVE bytes: ${filePath}`);
  const info = Buffer.concat([
    Buffer.from("INFO", "ascii"),
    riffChunk("IART", Buffer.from(`${SENTINELS.author}\0`)),
    riffChunk("INAM", Buffer.from(`${SENTINELS.title}\0`)),
    riffChunk("ICMT", Buffer.from(`${SENTINELS.comment}\0`)),
    riffChunk("ISFT", Buffer.from(`${SENTINELS.software}\0`)),
  ]);
  chunks.push(riffChunk("LIST", info));
  const output = Buffer.concat([bytes.subarray(0, 12), ...chunks]);
  output.writeUInt32LE(output.length - 8, 4);
  fs.writeFileSync(filePath, output);
}

function ebmlSize(value, forcedLength) {
  let length = forcedLength ?? 1;
  while (!forcedLength && value > 2 ** (7 * length) - 2) length++;
  if (length > 8 || value > 2 ** (7 * length) - 2) throw new Error("EBML size does not fit");
  const output = Buffer.alloc(length);
  let remaining = value;
  for (let i = length - 1; i >= 0; i--) {
    output[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  output[0] |= 0x80 >>> (length - 1);
  return output;
}

function ebmlElement(id, payload) {
  return Buffer.concat([Buffer.from(id), ebmlSize(payload.length), payload]);
}

function readEbmlSize(bytes, offset) {
  const first = bytes[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 8 && !(first & marker)) {
    marker >>>= 1;
    length++;
  }
  if (length > 8 || offset + length > bytes.length) throw new Error("Invalid EBML size");
  let value = first & (marker - 1);
  for (let i = 1; i < length; i++) value = value * 256 + bytes[offset + i];
  return { value, length, unknown: value === 2 ** (7 * length) - 1 };
}

function readEbmlId(bytes, offset) {
  const first = bytes[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 4 && !(first & marker)) {
    marker >>>= 1;
    length++;
  }
  if (length > 4 || offset + length > bytes.length) throw new Error("Invalid EBML element ID");
  let value = first;
  for (let index = 1; index < length; index++) value = value * 256 + bytes[offset + index];
  return { value, length };
}

function normalizeFirstClusterSize(bytes, segmentPayloadStart) {
  const ID_CLUSTER = 0x1f43b675;
  const segmentChildren = new Set([
    0x114d9b74, 0x1549a966, 0x1654ae6b, ID_CLUSTER, 0x1c53bb6b, 0x1941a469, 0x1043a770, 0x1254c367,
  ]);
  const clusterChildren = new Set([0xe7, 0x5854, 0xa7, 0xab, 0xa3, 0xa0, 0xaf, 0xec, 0xbf]);
  let offset = segmentPayloadStart;
  while (offset < bytes.length) {
    const id = readEbmlId(bytes, offset);
    const sizeOffset = offset + id.length;
    const size = readEbmlSize(bytes, sizeOffset);
    if (id.value === ID_CLUSTER) {
      if (!size.unknown) return;
      const payloadStart = sizeOffset + size.length;
      let childOffset = payloadStart;
      while (childOffset < bytes.length) {
        const childId = readEbmlId(bytes, childOffset);
        if (segmentChildren.has(childId.value)) break;
        if (!clusterChildren.has(childId.value)) throw new Error("Invalid child in synthetic unknown-size Cluster");
        const childSize = readEbmlSize(bytes, childOffset + childId.length);
        if (childSize.unknown) throw new Error("Unknown-size Cluster child cannot be normalized");
        childOffset += childId.length + childSize.length + childSize.value;
      }
      ebmlSize(childOffset - payloadStart, size.length).copy(bytes, sizeOffset);
      return;
    }
    if (size.unknown) throw new Error("Unknown-size element encountered before the first Cluster");
    offset = sizeOffset + size.length + size.value;
  }
  throw new Error("Matroska fixture has no Cluster");
}

function seedMatroska(filePath, includeMkvStructures) {
  const bytes = fs.readFileSync(filePath);
  const segmentId = Buffer.from([0x18, 0x53, 0x80, 0x67]);
  const segmentOffset = bytes.indexOf(segmentId);
  if (segmentOffset < 0) throw new Error(`Matroska Segment not found: ${filePath}`);
  const sizeOffset = segmentOffset + segmentId.length;
  const segmentSize = readEbmlSize(bytes, sizeOffset);
  const additions = [];

  if (!bytes.includes(Buffer.from(SENTINELS.comment))) {
    const tagName = ebmlElement([0x45, 0xa3], Buffer.from("COMMENT"));
    const tagValue = ebmlElement([0x44, 0x87], Buffer.from(SENTINELS.comment));
    const simpleTag = ebmlElement([0x67, 0xc8], Buffer.concat([tagName, tagValue]));
    const tag = ebmlElement([0x73, 0x73], simpleTag);
    additions.push(ebmlElement([0x12, 0x54, 0xc3, 0x67], tag));
  }

  if (includeMkvStructures && !bytes.includes(Buffer.from("PRIVMETA_TEST_COVER.jpg"))) {
    const coverPath = filesFor("jpeg")[0];
    if (!coverPath) throw new Error("A seeded JPEG fixture is required for the MKV attachment");
    const attachedFile = ebmlElement(
      [0x61, 0xa7],
      Buffer.concat([
        ebmlElement([0x46, 0x7e], Buffer.from("PRIVMETA_TEST_ATTACHMENT_DESCRIPTION")),
        ebmlElement([0x46, 0x6e], Buffer.from("PRIVMETA_TEST_COVER.jpg")),
        ebmlElement([0x46, 0x60], Buffer.from("image/jpeg")),
        ebmlElement([0x46, 0xae], Buffer.from([1])),
        ebmlElement([0x46, 0x5c], fs.readFileSync(coverPath)),
      ]),
    );
    additions.push(ebmlElement([0x19, 0x41, 0xa4, 0x69], attachedFile));
  }

  if (includeMkvStructures && !bytes.includes(Buffer.from("PRIVMETA_TEST_CHAPTER_TITLE"))) {
    const chapterDisplay = ebmlElement(
      [0x80],
      Buffer.concat([
        ebmlElement([0x85], Buffer.from("PRIVMETA_TEST_CHAPTER_TITLE")),
        ebmlElement([0x43, 0x7c], Buffer.from("eng")),
      ]),
    );
    const chapterAtom = ebmlElement(
      [0xb6],
      Buffer.concat([
        ebmlElement([0x73, 0xc4], Buffer.from([1])),
        ebmlElement([0x91], Buffer.from([0])),
        chapterDisplay,
      ]),
    );
    const edition = ebmlElement([0x45, 0xb9], chapterAtom);
    additions.push(ebmlElement([0x10, 0x43, 0xa7, 0x70], edition));
  }

  const additionLength = additions.reduce((total, addition) => total + addition.length, 0);
  const output = Buffer.concat([bytes, ...additions]);
  const payloadStart = sizeOffset + segmentSize.length;
  if (additions.length > 0 && !segmentSize.unknown) {
    if (segmentSize.value !== bytes.length - payloadStart) {
      throw new Error(`Matroska Segment size does not reach EOF: ${filePath}`);
    }
    ebmlSize(segmentSize.value + additionLength, segmentSize.length).copy(output, sizeOffset);
  }
  // Synthetic fixtures are finalized files with metadata following their
  // Cluster, so keep them explicitly sized. Authentic unknown-size coverage is
  // generated by Chromium before every privacy test run.
  normalizeFirstClusterSize(output, payloadStart);
  fs.writeFileSync(filePath, output);
}

async function seedDocx(filePath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  if (!zip.file("word/document.xml")) throw new Error(`DOCX document.xml is missing: ${filePath}`);
  const trackedAuthor = "PRIVMETA_TEST_TRACKED_AUTHOR";
  const commentAuthor = "PRIVMETA_TEST_COMMENT_AUTHOR";
  const personUserId = "PRIVMETA_TEST_PERSON_USER_ID";
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${SENTINELS.title}</dc:title><dc:subject>${SENTINELS.comment}</dc:subject><dc:creator>${SENTINELS.author}</dc:creator><cp:keywords>PRIVMETA_TEST_KEYWORDS</cp:keywords><cp:lastModifiedBy>${SENTINELS.author}</cp:lastModifiedBy><cp:revision>42</cp:revision></cp:coreProperties>`;
  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>${SENTINELS.software}</Application><Company>${SENTINELS.company}</Company><Manager>${SENTINELS.author}</Manager></Properties>`;
  const fixtureDate = new Date("2000-01-01T00:00:00.000Z");
  zip.file("docProps/core.xml", core, { date: fixtureDate });
  zip.file("docProps/app.xml", app, { date: fixtureDate });

  let documentXml = await zip.file("word/document.xml").async("string");
  if (!documentXml.includes(trackedAuthor)) {
    const paragraphMatch = documentXml.match(/<w:p\b[^>]*>/);
    if (!paragraphMatch || paragraphMatch.index === undefined) throw new Error(`DOCX has no paragraph: ${filePath}`);
    const paragraphOpen = paragraphMatch[0].replace(
      />$/,
      ' w:rsidR="A1B2C3D4" w:rsidRDefault="DEADBEEF">',
    );
    documentXml =
      documentXml.slice(0, paragraphMatch.index) +
      paragraphOpen +
      '<w:commentRangeStart w:id="987"/>' +
      documentXml.slice(paragraphMatch.index + paragraphMatch[0].length);
    documentXml = documentXml.replace(
      /<w:r\b[^>]*>[\s\S]*?<\/w:r>/,
      `<w:ins w:id="986" w:author="${trackedAuthor}" w:date="2024-01-02T03:04:05Z">$&</w:ins>`,
    );
    documentXml = documentXml.replace(
      /<\/w:p>/,
      '<w:commentRangeEnd w:id="987"/><w:r><w:commentReference w:id="987"/></w:r></w:p>',
    );
    zip.file("word/document.xml", documentXml, { date: fixtureDate });
  }

  const comments = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:comment w:id="987" w:author="${commentAuthor}" w:initials="PM" w:date="2024-01-02T03:04:05Z"><w:p w:rsidR="2468ACE0"><w:r><w:t>This comment content must be preserved.</w:t></w:r></w:p></w:comment></w:comments>`;
  const people = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="${commentAuthor}"><w15:presenceInfo w15:providerId="ActiveDirectory" w15:userId="${personUserId}"/></w15:person></w15:people>`;
  zip.file("word/comments.xml", comments, { date: fixtureDate });
  zip.file("word/people.xml", people, { date: fixtureDate });

  const relsPath = "word/_rels/document.xml.rels";
  let rels = await zip.file(relsPath).async("string");
  if (!rels.includes("relationships/comments")) {
    rels = rels.replace(
      /<\/Relationships>/,
      '<Relationship Id="rIdPrivacyComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/></Relationships>',
    );
  }
  if (!rels.includes("relationships/people")) {
    rels = rels.replace(
      /<\/Relationships>/,
      '<Relationship Id="rIdPrivacyPeople" Type="http://schemas.microsoft.com/office/2011/relationships/people" Target="people.xml"/></Relationships>',
    );
  }
  zip.file(relsPath, rels, { date: fixtureDate });

  let contentTypes = await zip.file("[Content_Types].xml").async("string");
  if (!contentTypes.includes('PartName="/word/comments.xml"')) {
    contentTypes = contentTypes.replace(
      /<\/Types>/,
      '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>',
    );
  }
  if (!contentTypes.includes('PartName="/word/people.xml"')) {
    contentTypes = contentTypes.replace(
      /<\/Types>/,
      '<Override PartName="/word/people.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.people+xml"/></Types>',
    );
  }
  zip.file("[Content_Types].xml", contentTypes, { date: fixtureDate });

  const settingsEntry = zip.file("word/settings.xml");
  if (settingsEntry) {
    let settings = await settingsEntry.async("string");
    settings = settings.replace(/<w:rsids\b[^>]*>[\s\S]*?<\/w:rsids\s*>/g, "");
    settings = settings.replace(
      /<\/w:settings>/,
      '<w:rsids><w:rsidRoot w:val="13572468"/><w:rsid w:val="A1B2C3D4"/></w:rsids></w:settings>',
    );
    zip.file("word/settings.xml", settings, { date: fixtureDate });
  }
  const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  fs.writeFileSync(filePath, output);
}

const exifAssignments = {
  jpeg: [
    ["EXIF:Artist", SENTINELS.author],
    ["EXIF:ImageDescription", SENTINELS.comment],
    ["EXIF:UserComment", SENTINELS.comment],
    ["EXIF:Software", SENTINELS.software],
    ["EXIF:GPSLatitude", "51.5007"],
    ["EXIF:GPSLatitudeRef", "North"],
    ["EXIF:GPSLongitude", "0.1246"],
    ["EXIF:GPSLongitudeRef", "West"],
  ],
  png: [
    ["PNG:Title", SENTINELS.title],
    ["PNG:Author", SENTINELS.author],
    ["PNG:Comment", SENTINELS.comment],
    ["PNG:Software", SENTINELS.software],
  ],
  webp: [
    ["XMP-dc:Title", SENTINELS.title],
    ["XMP-dc:Creator", SENTINELS.author],
    ["XMP-dc:Description", SENTINELS.comment],
    ["XMP-xmp:CreatorTool", SENTINELS.software],
  ],
  gif: [["Comment", SENTINELS.comment]],
  pdf: [
    ["PDF:Author", SENTINELS.author],
    ["PDF:Title", SENTINELS.title],
    ["PDF:Subject", SENTINELS.comment],
    ["PDF:Keywords", "PRIVMETA_TEST_KEYWORDS"],
    ["PDF:Creator", SENTINELS.software],
  ],
  mov: [
    ["QuickTime:Title", SENTINELS.title],
    ["QuickTime:Artist", SENTINELS.author],
    ["QuickTime:Comment", SENTINELS.comment],
    ["QuickTime:Software", SENTINELS.software],
    ["Keys:GPSCoordinates", "+51.5007-000.1246/"],
  ],
  mp4: [
    ["QuickTime:Title", SENTINELS.title],
    ["QuickTime:Artist", SENTINELS.author],
    ["QuickTime:Comment", SENTINELS.comment],
    ["QuickTime:Software", SENTINELS.software],
    ["Keys:GPSCoordinates", "+51.5007-000.1246/"],
  ],
  m4a: [
    ["QuickTime:Title", SENTINELS.title],
    ["QuickTime:Artist", SENTINELS.author],
    ["QuickTime:Comment", SENTINELS.comment],
    ["QuickTime:Software", SENTINELS.software],
  ],
};

const requiredPatterns = {
  jpeg: ["*:Artist", "*:UserComment", "*GPS*"],
  png: ["*:Author", "*:Comment", "*:Software"],
  webp: ["XMP-*:*"],
  gif: ["*:Comment"],
  pdf: ["PDF:Author", "PDF:Title", "PDF:Subject", "PDF:Keywords"],
  docx: ["*:Creator", "*:LastModifiedBy", "*:Company"],
  mov: ["*:Title", "*:Artist", "*:Comment", "*GPS*"],
  mp4: ["*:Title", "*:Artist", "*:Comment", "*GPS*"],
  m4a: ["*:Title", "*:Artist", "*:Comment"],
  mp3: ["ID3v2*:*"],
  aac: ["ID3v2*:*"],
  flac: ["Vorbis:*"],
  wav: ["RIFF:Artist", "RIFF:Comment", "RIFF:Software"],
  mkv: ["*:Comment", "*:AttachedFileDescription", "*:AttachedFileName", "*:ChapterString"],
  webm: ["*:Comment"],
};

async function main() {
  const exifTool = resolveExifTool();
  let count = 0;
  for (const [extension, assignments] of Object.entries(exifAssignments)) {
    for (const filePath of filesFor(extension)) {
      runExifTool(exifTool, filePath, assignments);
      writeSidecar(filePath, requiredPatterns[extension], `Seeded ${extension.toUpperCase()} privacy regression fixture.`);
      count++;
    }
  }
  for (const extension of ["mp3", "aac"]) {
    for (const filePath of filesFor(extension)) {
      seedId3(filePath);
      writeSidecar(filePath, requiredPatterns[extension], `Seeded ${extension.toUpperCase()} ID3 regression fixture.`);
      count++;
    }
  }
  for (const filePath of filesFor("flac")) {
    seedFlac(filePath);
    writeSidecar(filePath, requiredPatterns.flac, "Seeded FLAC Vorbis-comment regression fixture.");
    count++;
  }
  for (const filePath of filesFor("wav")) {
    seedWav(filePath);
    writeSidecar(filePath, requiredPatterns.wav, "Seeded WAVE RIFF INFO regression fixture.");
    count++;
  }
  for (const extension of ["mkv", "webm"]) {
    for (const filePath of filesFor(extension)) {
      seedMatroska(filePath, extension === "mkv");
      writeSidecar(filePath, requiredPatterns[extension], `Seeded ${extension.toUpperCase()} Matroska-tag regression fixture.`);
      count++;
    }
  }
  for (const filePath of filesFor("docx")) {
    await seedDocx(filePath);
    writeSidecar(filePath, requiredPatterns.docx, "Seeded DOCX package-properties regression fixture.");
    count++;
  }
  console.log(`Seeded ${count} synthetic privacy fixtures.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
