import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import {
  getPolicy,
  isSupportedExtension,
  type FixtureOverrides,
  type SupportedExtension,
} from "./policies";

export type MetadataSnapshot = Record<string, unknown>;

export type FixtureCase = {
  id: string;
  inputPath: string;
  extension: SupportedExtension;
  overrides: FixtureOverrides;
};

export type BrowserProbe = {
  supported: boolean;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
};

export type PrivacyResult = {
  id: string;
  extension: SupportedExtension;
  inputPath: string;
  outputPath?: string;
  status: "pass" | "warn" | "fail";
  removedTagCount: number;
  forbiddenAfter: string[];
  sentinelsFoundAfter: string[];
  preserved: string[];
  warnings: string[];
  errors: string[];
  notes?: string;
};

const exifToolArguments = ["-j", "-G1:4", "-s", "-n", "-api", "RequestAll=3", "-ee3", "-a"];
const technicalTags = [
  "FileType",
  "Duration",
  "ImageSize",
  "ImageWidth",
  "ImageHeight",
  "VideoFrameRate",
  "CompressorID",
  "Rotation",
  "AudioSampleRate",
  "AudioChannels",
  "SampleRate",
  "Channels",
  "NumChannels",
  "PageCount",
  "FrameCount",
  "AnimationIterations",
];

function runExifTool(executable: string, args: string[]): string {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`ExifTool exited with code ${result.status}: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

export function resolveExifTool(): string {
  const candidates = [
    process.env.EXIFTOOL_PATH,
    process.platform === "win32" ? "C:\\Users\\scaif\\AppData\\Local\\Programs\\ExifTool\\exiftool.exe" : undefined,
    "exiftool",
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-ver"], { encoding: "utf8", windowsHide: true });
    if (!result.error && result.status === 0) return candidate;
  }

  throw new Error(
    "ExifTool was not found. Install it or set EXIFTOOL_PATH to the executable before running npm run privacy:test.",
  );
}

function parseSingleJsonObject(output: string): MetadataSnapshot {
  const parsed = JSON.parse(output) as MetadataSnapshot[];
  if (!Array.isArray(parsed) || !parsed[0]) throw new Error("ExifTool did not return a JSON object");
  const snapshot = parsed[0];
  for (const key of Object.keys(snapshot)) {
    if (key === "SourceFile" || key.endsWith(":SourceFile")) delete snapshot[key];
  }
  return snapshot;
}

export function readMetadata(executable: string, filePath: string): MetadataSnapshot {
  return parseSingleJsonObject(runExifTool(executable, [...exifToolArguments, filePath]));
}

export function readTechnicalMetadata(executable: string, filePath: string): MetadataSnapshot {
  const args = ["-j", "-n", ...technicalTags.map((tag) => `-${tag}`), filePath];
  return parseSingleJsonObject(runExifTool(executable, args));
}

export function validateWithExifTool(executable: string, filePath: string): { errors: string[]; warnings: string[] } {
  const snapshot = parseSingleJsonObject(
    runExifTool(executable, ["-j", "-G1", "-s", "-validate", "-warning", "-error", "-a", filePath]),
  );
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [tag, value] of Object.entries(snapshot)) {
    const text = String(value);
    if (tag.endsWith(":Validate") && text !== "OK") errors.push(`ExifTool validation: ${text}`);
    if (tag.endsWith(":Error")) errors.push(`ExifTool: ${text}`);
    if (tag.endsWith(":Warning")) warnings.push(`ExifTool: ${text}`);
  }
  return { errors, warnings };
}

function wildcardRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function tagMatches(tag: string, pattern: string): boolean {
  const regex = wildcardRegex(pattern);
  const baseTag = tag.split(":").at(-1) ?? tag;
  return regex.test(tag) || regex.test(baseTag);
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "object") return Object.values(value).some(hasMeaningfulValue);
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  return trimmed !== "" && !/^0{4}:0{2}:0{2} 0{2}:0{2}:0{2}/.test(trimmed);
}

function matchingTags(snapshot: MetadataSnapshot, patterns: string[]): string[] {
  return Object.entries(snapshot)
    .filter(([tag, value]) => hasMeaningfulValue(value) && patterns.some((pattern) => tagMatches(tag, pattern)))
    .map(([tag]) => tag)
    .sort();
}

function findTechnicalValue(snapshot: MetadataSnapshot, tag: string): unknown {
  const aliases: Record<string, string[]> = {
    AudioSampleRate: ["AudioSampleRate", "SampleRate"],
    AudioChannels: ["AudioChannels", "Channels", "NumChannels"],
  };
  for (const candidate of aliases[tag] ?? [tag]) {
    const exact = snapshot[candidate];
    if (exact !== undefined) return exact;
    const grouped = Object.entries(snapshot).find(([key]) => key.split(":").at(-1) === candidate)?.[1];
    if (grouped !== undefined) return grouped;
  }
  return undefined;
}

function valuesEqual(before: unknown, after: unknown, tag: string, extension: SupportedExtension): boolean {
  if (tag === "FileType") {
    if (extension === "webp" && [before, after].every((value) => value === "WEBP" || value === "Extended WEBP")) {
      return true;
    }
    // ExifTool identifies raw AAC with a non-standard leading ID3 tag as MP3;
    // after the tag is stripped it correctly reports AAC.
    if (extension === "aac" && before === "MP3" && after === "AAC") return true;
  }
  if (typeof before === "number" && typeof after === "number") {
    const tolerance = tag === "Duration" ? 0.02 : tag === "VideoFrameRate" ? 0.001 : 0;
    return Math.abs(before - after) <= tolerance;
  }
  return JSON.stringify(before) === JSON.stringify(after);
}

function discoverFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const found: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) found.push(...discoverFiles(fullPath));
    else if (entry.isFile()) found.push(fullPath);
  }
  return found;
}

function readOverrides(filePath: string): FixtureOverrides {
  const sidecarPath = `${filePath}.privacy.json`;
  if (!fs.existsSync(sidecarPath)) return {};
  const value = JSON.parse(fs.readFileSync(sidecarPath, "utf8")) as FixtureOverrides;
  for (const key of ["requiredBefore", "forbiddenAfter", "preserveTags", "sentinels"] as const) {
    if (value[key] !== undefined && (!Array.isArray(value[key]) || value[key].some((item) => typeof item !== "string"))) {
      throw new Error(`${sidecarPath}: ${key} must be an array of strings`);
    }
  }
  return value;
}

export function discoverFixtures(defaultRoots: string[]): FixtureCase[] {
  const configuredRoot = process.env.PRIVMETA_FIXTURES_DIR;
  const roots = configuredRoot ? [path.resolve(configuredRoot)] : defaultRoots;
  const cases: FixtureCase[] = [];

  for (const root of roots) {
    for (const inputPath of discoverFiles(root)) {
      if (inputPath.endsWith(".privacy.json") || path.basename(inputPath).startsWith(".")) continue;
      const extension = path.extname(inputPath).slice(1).toLowerCase();
      if (!isSupportedExtension(extension) || /_cleaned\.[^.]+$/i.test(inputPath)) continue;
      const relative = path.relative(root, inputPath).replaceAll(path.sep, "/");
      const rootLabel = path.basename(root);
      cases.push({
        id: `${rootLabel}/${relative}`,
        inputPath,
        extension,
        overrides: readOverrides(inputPath),
      });
    }
  }
  return cases.sort((a, b) => a.id.localeCompare(b.id));
}

function extractAutomaticSentinels(bytes: Buffer): string[] {
  const ascii = bytes.toString("latin1");
  const utf16 = bytes.toString("utf16le");
  const pattern = /PRIVMETA_TEST_[A-Z0-9_-]+/g;
  return [...new Set([...(ascii.match(pattern) ?? []), ...(utf16.match(pattern) ?? [])])];
}

function bufferContainsSentinel(bytes: Buffer, sentinel: string): boolean {
  return bytes.includes(Buffer.from(sentinel, "utf8")) || bytes.includes(Buffer.from(sentinel, "utf16le"));
}

export async function validateDocumentIntegrity(
  extension: SupportedExtension,
  beforePath: string,
  afterPath: string,
): Promise<{ errors: string[]; preserved: string[] }> {
  const errors: string[] = [];
  const preserved: string[] = [];

  if (extension === "pdf") {
    try {
      const before = await PDFDocument.load(fs.readFileSync(beforePath), { updateMetadata: false });
      const after = await PDFDocument.load(fs.readFileSync(afterPath), { updateMetadata: false });
      if (before.getPageCount() !== after.getPageCount()) errors.push("PDF page count changed");
      else preserved.push(`PageCount=${after.getPageCount()}`);
    } catch (error) {
      errors.push(`PDF validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (extension === "docx") {
    try {
      const zip = await JSZip.loadAsync(fs.readFileSync(afterPath));
      if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
        errors.push("Cleaned DOCX is missing required package parts");
      } else {
        preserved.push("DOCX package structure");
      }
    } catch (error) {
      errors.push(`DOCX ZIP validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { errors, preserved };
}

export function assessPrivacyCase(args: {
  fixture: FixtureCase;
  outputPath: string;
  beforeMetadata: MetadataSnapshot;
  afterMetadata: MetadataSnapshot;
  beforeTechnical: MetadataSnapshot;
  afterTechnical: MetadataSnapshot;
  exifValidation: { errors: string[]; warnings: string[] };
  browserBefore?: BrowserProbe;
  browserAfter?: BrowserProbe;
  documentValidation: { errors: string[]; preserved: string[] };
}): PrivacyResult {
  const { fixture } = args;
  const policy = getPolicy(fixture.extension);
  const forbiddenPatterns = [...policy.forbiddenAfter, ...(fixture.overrides.forbiddenAfter ?? [])];
  const requiredPatterns = fixture.overrides.requiredBefore ?? [];
  const preserveTags = fixture.overrides.preserveTags ?? policy.preserveTags;
  const optionalPreserveTags = fixture.overrides.preserveTags ? [] : (policy.optionalPreserveTags ?? []);
  const errors = [...args.exifValidation.errors, ...args.documentValidation.errors];
  const warnings = [...args.exifValidation.warnings];
  const preserved = [...args.documentValidation.preserved];

  for (const required of requiredPatterns) {
    if (matchingTags(args.beforeMetadata, [required]).length === 0) {
      errors.push(`Original fixture is missing required metadata: ${required}`);
    }
  }

  const recognizedBefore = matchingTags(args.beforeMetadata, forbiddenPatterns);
  if (recognizedBefore.length === 0 && requiredPatterns.length === 0) {
    warnings.push("Original contains no metadata recognized by the current removal policy");
  }

  const forbiddenAfter = matchingTags(args.afterMetadata, forbiddenPatterns);
  if (forbiddenAfter.length > 0) errors.push(`Forbidden metadata remains: ${forbiddenAfter.join(", ")}`);

  for (const [tag, optional] of [
    ...preserveTags.map((value) => [value, false] as const),
    ...optionalPreserveTags.map((value) => [value, true] as const),
  ]) {
    const before = findTechnicalValue(args.beforeTechnical, tag);
    const after = findTechnicalValue(args.afterTechnical, tag);
    if (before === undefined) {
      if (!optional) warnings.push(`Preservation field was not reported for the original: ${tag}`);
    } else if (after === undefined) {
      errors.push(`Preservation field disappeared: ${tag}`);
    } else if (!valuesEqual(before, after, tag, fixture.extension)) {
      errors.push(`Preservation field changed: ${tag} (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
    } else {
      preserved.push(`${tag}=${JSON.stringify(after)}`);
    }
  }

  if (args.browserAfter) {
    if (!args.browserAfter.supported) {
      const message = `Browser could not decode cleaned ${policy.browserProbe}: ${args.browserAfter.error ?? "unknown error"}`;
      if (policy.browserProbe === "image") errors.push(message);
      else warnings.push(message);
    } else if (args.browserBefore?.supported) {
      for (const dimension of ["width", "height"] as const) {
        if (args.browserBefore[dimension] !== args.browserAfter[dimension]) {
          errors.push(`Browser ${dimension} changed (${args.browserBefore[dimension]} -> ${args.browserAfter[dimension]})`);
        }
      }
      if (
        args.browserBefore.duration !== undefined &&
        args.browserAfter.duration !== undefined &&
        Math.abs(args.browserBefore.duration - args.browserAfter.duration) > 0.02
      ) {
        errors.push(`Browser duration changed (${args.browserBefore.duration} -> ${args.browserAfter.duration})`);
      }
      preserved.push("Browser decode");
    }
  }

  const beforeBytes = fs.readFileSync(fixture.inputPath);
  const afterBytes = fs.readFileSync(args.outputPath);
  const sentinels = [...new Set([...(fixture.overrides.sentinels ?? []), ...extractAutomaticSentinels(beforeBytes)])];
  const sentinelsFoundAfter = sentinels.filter((sentinel) => bufferContainsSentinel(afterBytes, sentinel));
  if (sentinelsFoundAfter.length > 0) errors.push(`Raw sentinel strings remain: ${sentinelsFoundAfter.join(", ")}`);

  const removedTagCount = Object.keys(args.beforeMetadata).filter((tag) => !(tag in args.afterMetadata)).length;
  return {
    id: fixture.id,
    extension: fixture.extension,
    inputPath: fixture.inputPath,
    outputPath: args.outputPath,
    status: errors.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass",
    removedTagCount,
    forbiddenAfter,
    sentinelsFoundAfter,
    preserved,
    warnings,
    errors,
    notes: fixture.overrides.notes,
  };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function writeReports(results: PrivacyResult[], outputDirectory: string): void {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "report.json"), `${JSON.stringify(results, null, 2)}\n`);

  const markdownRows = results.map(
    (result) =>
      `| ${result.status.toUpperCase()} | ${result.id.replaceAll("|", "\\|")} | ${result.removedTagCount} | ${result.errors.length} | ${result.warnings.length} |`,
  );
  const markdown = [
    "# PrivMeta privacy test report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Status | Fixture | Removed tags | Errors | Warnings |",
    "|---|---|---:|---:|---:|",
    ...markdownRows,
    "",
    ...results.flatMap((result) => [
      `## ${result.status.toUpperCase()}: ${result.id}`,
      "",
      ...(result.errors.length ? ["Errors:", "", ...result.errors.map((value) => `- ${value}`), ""] : []),
      ...(result.warnings.length ? ["Warnings:", "", ...result.warnings.map((value) => `- ${value}`), ""] : []),
    ]),
  ].join("\n");
  fs.writeFileSync(path.join(outputDirectory, "report.md"), `${markdown}\n`);

  const rows = results
    .map(
      (result) => `<tr><td class="${result.status}">${result.status.toUpperCase()}</td><td>${escapeHtml(result.id)}</td><td>${result.removedTagCount}</td><td>${result.errors.length}</td><td>${result.warnings.length}</td></tr>`,
    )
    .join("\n");
  const details = results
    .map(
      (result) => `<section><h2>${escapeHtml(result.id)}</h2>${result.errors.map((value) => `<p class="fail">Error: ${escapeHtml(value)}</p>`).join("")}${result.warnings.map((value) => `<p class="warn">Warning: ${escapeHtml(value)}</p>`).join("")}</section>`,
    )
    .join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PrivMeta privacy report</title><style>body{font:15px system-ui;max-width:1100px;margin:40px auto;padding:0 20px}table{border-collapse:collapse;width:100%}th,td{padding:8px;border:1px solid #ccc;text-align:left}.pass{color:#087830}.warn{color:#956400}.fail{color:#b42318}section{border-top:1px solid #ddd;margin-top:24px}</style></head><body><h1>PrivMeta privacy test report</h1><p>Generated ${escapeHtml(new Date().toISOString())}</p><table><thead><tr><th>Status</th><th>Fixture</th><th>Removed tags</th><th>Errors</th><th>Warnings</th></tr></thead><tbody>${rows}</tbody></table>${details}</body></html>`;
  fs.writeFileSync(path.join(outputDirectory, "report.html"), html);
}
