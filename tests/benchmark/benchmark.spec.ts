import { chromium, expect, test, type Browser, type BrowserContext, type CDPSession, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { performance as nodePerformance } from "node:perf_hooks";
import {
  assessPrivacyCase,
  discoverFixtures,
  readMetadata,
  readTechnicalMetadata,
  resolveExifTool,
  validateDocumentIntegrity,
  validateWithExifTool,
  type BrowserProbe,
  type FixtureCase,
  type PrivacyResult,
} from "../privacy/harness";
import { getPolicy } from "../privacy/policies";

type Variant = { key: "old" | "new"; label: string; url: string };
type LoadMetrics = {
  coldLoadMs: number;
  warmLoadMs: number;
  coldTransferBytes: number;
  warmTransferBytes: number;
  resourceCount: number;
  firstContentfulPaintMs?: number;
  largestContentfulPaintMs?: number;
};
type ProcessingRun = {
  durationMs: number;
  outputBytes: number;
  peakJsHeapBytes?: number;
  maxMainThreadGapMs?: number;
};
type CaseBenchmark = {
  id: string;
  extension: string;
  inputBytes: number;
  outputPath?: string;
  outputBytes?: number;
  runs: ProcessingRun[];
  medianDurationMs?: number;
  medianPeakJsHeapBytes?: number;
  maxMainThreadGapMs?: number;
  privacy?: PrivacyResult;
  error?: string;
};
type VariantResult = { variant: Variant; load: LoadMetrics; cases: CaseBenchmark[] };

const repositoryRoot = path.resolve(__dirname, "../..");
const reportDirectory = path.join(repositoryRoot, "benchmark-results");
const fixtureRoots = [
  path.join(repositoryRoot, "tests", "privacy", "fixtures", "real"),
  path.join(repositoryRoot, "tests", "privacy", "fixtures", "synthetic"),
];
const runCount = Math.max(1, Number.parseInt(process.env.PRIVMETA_BENCHMARK_RUNS || "3", 10));
const localMode = process.env.PRIVMETA_BENCHMARK_LOCAL === "1";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required. Use npm run benchmark:compare -- --old=<url> --new=<url>.`);
  return value.replace(/\/$/, "");
}

const variants: Variant[] = [
  {
    key: "old",
    label: process.env.PRIVMETA_BENCHMARK_OLD_LABEL || "master",
    url: requiredEnvironment("PRIVMETA_BENCHMARK_OLD_URL"),
  },
  {
    key: "new",
    label: process.env.PRIVMETA_BENCHMARK_NEW_LABEL || "cloudflare-migration",
    url: requiredEnvironment("PRIVMETA_BENCHMARK_NEW_URL"),
  },
];

function selectedFixtures(): FixtureCase[] {
  const fixtures = discoverFixtures(fixtureRoots);
  const filter = process.env.PRIVMETA_BENCHMARK_FILTER;
  if (!filter) return fixtures;
  const expression = new RegExp(filter, "i");
  return fixtures.filter((fixture) => expression.test(fixture.id));
}

function resetReports(): void {
  const resolved = path.resolve(reportDirectory);
  if (!resolved.startsWith(`${repositoryRoot}${path.sep}`) || path.basename(resolved) !== "benchmark-results") {
    throw new Error(`Refusing to clear unexpected benchmark directory: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(resolved, { recursive: true });
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function navigationSnapshot(page: Page): Promise<{
  loadMs: number;
  transferBytes: number;
  resourceCount: number;
  firstContentfulPaintMs?: number;
  largestContentfulPaintMs?: number;
}> {
  return page.evaluate(() => {
    const navigation = performance.getEntries().find((entry) => String(entry.entryType) === "navigation") as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const paints = performance.getEntries().filter((entry) => String(entry.entryType) === "paint");
    const firstContentfulPaint = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime;
    const largestContentfulPaint = (window as typeof window & { __benchmarkLcp?: number }).__benchmarkLcp;
    return {
      loadMs: navigation?.loadEventEnd || performance.now(),
      transferBytes: (navigation?.transferSize || 0) + resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      resourceCount: resources.length + 1,
      firstContentfulPaintMs: firstContentfulPaint,
      largestContentfulPaintMs: largestContentfulPaint,
    };
  });
}

async function measurePageLoad(browser: Browser, url: string): Promise<LoadMetrics> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    (window as typeof window & { __benchmarkLcp?: number }).__benchmarkLcp = undefined;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (last) (window as typeof window & { __benchmarkLcp?: number }).__benchmarkLcp = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(500);
  const cold = await navigationSnapshot(page);
  await page.reload({ waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(500);
  const warm = await navigationSnapshot(page);
  await context.close();

  return {
    coldLoadMs: cold.loadMs,
    warmLoadMs: warm.loadMs,
    coldTransferBytes: cold.transferBytes,
    warmTransferBytes: warm.transferBytes,
    resourceCount: cold.resourceCount,
    firstContentfulPaintMs: cold.firstContentfulPaintMs,
    largestContentfulPaintMs: cold.largestContentfulPaintMs,
  };
}

async function readJsHeap(cdp: CDPSession): Promise<number | undefined> {
  try {
    const response = await cdp.send("Performance.getMetrics");
    return response.metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value;
  } catch {
    return undefined;
  }
}

async function processOnce(
  page: Page,
  context: BrowserContext,
  variant: Variant,
  fixture: FixtureCase,
  outputDirectory: string,
  runIndex: number,
): Promise<{ run: ProcessingRun; outputPath: string }> {
  await page.goto(variant.url, { waitUntil: "load", timeout: 120_000 });
  const input = page.locator('input[type="file"]');
  await expect(input).toBeAttached();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await input.setInputFiles(fixture.inputPath);

  const removeButton = page.getByRole("button", { name: "Remove metadata" });
  await expect(removeButton).toBeEnabled();

  await page.evaluate(() => {
    const state = { last: performance.now(), maxGap: 0, timer: 0 };
    state.timer = window.setInterval(() => {
      const now = performance.now();
      state.maxGap = Math.max(state.maxGap, now - state.last);
      state.last = now;
    }, 16);
    (window as typeof window & { __benchmarkResponsiveness?: typeof state }).__benchmarkResponsiveness = state;
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  let peakJsHeapBytes = await readJsHeap(cdp);
  let sampling = false;
  const heapTimer = setInterval(async () => {
    if (sampling) return;
    sampling = true;
    const value = await readJsHeap(cdp);
    if (value !== undefined) peakJsHeapBytes = Math.max(peakJsHeapBytes || 0, value);
    sampling = false;
  }, 50);

  const started = nodePerformance.now();
  let durationMs = 0;
  let outputPath = "";
  let responsiveness: number | undefined;
  try {
    const downloadPromise = page.waitForEvent("download", { timeout: 180_000 });
    await removeButton.click();
    const download = await downloadPromise;
    const failure = await download.failure();
    if (failure) throw new Error(`Download failed: ${failure}`);

    fs.mkdirSync(outputDirectory, { recursive: true });
    outputPath = path.join(outputDirectory, `run-${runIndex + 1}-${download.suggestedFilename()}`);
    await download.saveAs(outputPath);
    durationMs = nodePerformance.now() - started;
  } finally {
    clearInterval(heapTimer);
    const finalHeap = await readJsHeap(cdp);
    if (finalHeap !== undefined) peakJsHeapBytes = Math.max(peakJsHeapBytes || 0, finalHeap);
    await cdp.detach().catch(() => undefined);
    responsiveness = await page.evaluate(() => {
      const state = (window as typeof window & {
        __benchmarkResponsiveness?: { last: number; maxGap: number; timer: number };
      }).__benchmarkResponsiveness;
      if (!state) return undefined;
      window.clearInterval(state.timer);
      return state.maxGap;
    }).catch(() => undefined);
  }

  return {
    run: {
      durationMs,
      outputBytes: fs.statSync(outputPath).size,
      peakJsHeapBytes,
      maxMainThreadGapMs: responsiveness,
    },
    outputPath,
  };
}

async function probeFile(page: Page, url: string, filePath: string, kind: "image" | "video" | "audio" | "none"): Promise<BrowserProbe | undefined> {
  if (kind === "none") return undefined;
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  await page.evaluate(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.id = "benchmark-probe";
    input.hidden = true;
    document.body.append(input);
  });
  await page.locator("#benchmark-probe").setInputFiles(filePath);
  return page.evaluate(async (probeKind) => {
    const file = (document.querySelector("#benchmark-probe") as HTMLInputElement | null)?.files?.[0];
    if (!file) return { supported: false, error: "Probe input is empty" };
    const objectUrl = URL.createObjectURL(file);
    try {
      if (probeKind === "image") {
        const image = new Image();
        const result = new Promise<BrowserProbe>((resolve) => {
          image.onload = () => resolve({ supported: true, width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ supported: false, error: "Image decode failed" });
        });
        image.src = objectUrl;
        return await result;
      }
      const media = document.createElement(probeKind);
      media.preload = "metadata";
      const result = new Promise<BrowserProbe>((resolve) => {
        const timer = window.setTimeout(() => resolve({ supported: false, error: "Media probe timed out" }), 15_000);
        media.onloadedmetadata = () => {
          window.clearTimeout(timer);
          resolve({
            supported: true,
            duration: Number.isFinite(media.duration) ? media.duration : undefined,
            width: media instanceof HTMLVideoElement ? media.videoWidth : undefined,
            height: media instanceof HTMLVideoElement ? media.videoHeight : undefined,
          });
        };
        media.onerror = () => {
          window.clearTimeout(timer);
          resolve({ supported: false, error: media.error?.message || `Media error ${media.error?.code ?? "unknown"}` });
        };
      });
      media.src = objectUrl;
      return await result;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, kind);
}

async function benchmarkFixture(
  browser: Browser,
  variant: Variant,
  fixture: FixtureCase,
  exifTool: string,
): Promise<CaseBenchmark> {
  const outputDirectory = path.join(reportDirectory, variant.key, fixture.id.replace(/[^a-z0-9._-]+/gi, "_"));
  const result: CaseBenchmark = {
    id: fixture.id,
    extension: fixture.extension,
    inputBytes: fs.statSync(fixture.inputPath).size,
    runs: [],
  };
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    let retainedOutput: string | undefined;
    for (let runIndex = 0; runIndex < runCount; runIndex++) {
      const measured = await processOnce(page, context, variant, fixture, outputDirectory, runIndex);
      result.runs.push(measured.run);
      if (runIndex === 0) retainedOutput = measured.outputPath;
      else fs.rmSync(measured.outputPath, { force: true });
    }
    if (!retainedOutput) throw new Error("No output was downloaded");

    result.outputPath = retainedOutput;
    result.outputBytes = fs.statSync(retainedOutput).size;
    result.medianDurationMs = median(result.runs.map((run) => run.durationMs));
    result.medianPeakJsHeapBytes = median(
      result.runs.flatMap((run) => run.peakJsHeapBytes === undefined ? [] : [run.peakJsHeapBytes]),
    );
    const observedGaps = result.runs.flatMap((run) => run.maxMainThreadGapMs === undefined ? [] : [run.maxMainThreadGapMs]);
    result.maxMainThreadGapMs = observedGaps.length > 0 ? Math.max(...observedGaps) : undefined;

    const policy = getPolicy(fixture.extension);
    const beforeMetadata = readMetadata(exifTool, fixture.inputPath);
    const afterMetadata = readMetadata(exifTool, retainedOutput);
    const browserBefore = await probeFile(page, variant.url, fixture.inputPath, policy.browserProbe);
    const browserAfter = await probeFile(page, variant.url, retainedOutput, policy.browserProbe);
    result.privacy = assessPrivacyCase({
      fixture,
      outputPath: retainedOutput,
      beforeMetadata,
      afterMetadata,
      beforeTechnical: readTechnicalMetadata(exifTool, fixture.inputPath),
      afterTechnical: readTechnicalMetadata(exifTool, retainedOutput),
      exifValidation: validateWithExifTool(exifTool, retainedOutput),
      browserBefore,
      browserAfter,
      documentValidation: await validateDocumentIntegrity(fixture.extension, fixture.inputPath, retainedOutput),
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    await context.close();
  }
  return result;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function formatNumber(value: number | undefined, digits = 0): string {
  return value === undefined || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

function writeReport(results: VariantResult[]): void {
  fs.writeFileSync(path.join(reportDirectory, "report.json"), `${JSON.stringify({ generated: new Date().toISOString(), mode: localMode ? "local-branches" : "deployed-urls", runCount, results }, null, 2)}\n`);
  const [oldResult, newResult] = results;
  const newById = new Map(newResult.cases.map((item) => [item.id, item]));
  const rows = oldResult.cases.map((oldCase) => {
    const newCase = newById.get(oldCase.id);
    const delta = oldCase.medianDurationMs && newCase?.medianDurationMs
      ? ((newCase.medianDurationMs - oldCase.medianDurationMs) / oldCase.medianDurationMs) * 100
      : undefined;
    const oldStatus = oldCase.error ? "ERROR" : oldCase.privacy?.status.toUpperCase() || "—";
    const newStatus = newCase?.error ? "ERROR" : newCase?.privacy?.status.toUpperCase() || "—";
    return `<tr><td>${escapeHtml(oldCase.id)}</td><td class="${oldStatus.toLowerCase()}">${oldStatus}</td><td class="${newStatus.toLowerCase()}">${newStatus}</td><td>${formatNumber(oldCase.medianDurationMs)} ms</td><td>${formatNumber(newCase?.medianDurationMs)} ms</td><td>${delta === undefined ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}</td><td>${formatNumber(oldCase.outputBytes ? oldCase.outputBytes / 1024 : undefined, 1)} KiB</td><td>${formatNumber(newCase?.outputBytes ? newCase.outputBytes / 1024 : undefined, 1)} KiB</td><td>${formatNumber(oldCase.medianPeakJsHeapBytes ? oldCase.medianPeakJsHeapBytes / 1048576 : undefined, 1)} MiB</td><td>${formatNumber(newCase?.medianPeakJsHeapBytes ? newCase.medianPeakJsHeapBytes / 1048576 : undefined, 1)} MiB</td><td>${formatNumber(oldCase.maxMainThreadGapMs, 1)} ms</td><td>${formatNumber(newCase?.maxMainThreadGapMs, 1)} ms</td></tr>`;
  }).join("\n");
  const detailSections = results.flatMap((variantResult) => variantResult.cases
    .filter((item) => item.error || item.privacy?.errors.length || item.privacy?.warnings.length)
    .map((item) => `<section><h3>${escapeHtml(variantResult.variant.label)} — ${escapeHtml(item.id)}</h3>${item.error ? `<p class="fail">${escapeHtml(item.error)}</p>` : ""}${(item.privacy?.errors || []).map((message) => `<p class="fail">${escapeHtml(message)}</p>`).join("")}${(item.privacy?.warnings || []).map((message) => `<p class="warn">${escapeHtml(message)}</p>`).join("")}</section>`)
  ).join("\n");
  const loadRows = results.map(({ variant, load }) => `<tr><td>${escapeHtml(variant.label)}</td><td>${formatNumber(load.coldLoadMs)} ms</td><td>${formatNumber(load.warmLoadMs)} ms</td><td>${formatNumber(load.coldTransferBytes / 1024, 1)} KiB</td><td>${formatNumber(load.warmTransferBytes / 1024, 1)} KiB</td><td>${load.resourceCount}</td><td>${formatNumber(load.firstContentfulPaintMs)} ms</td><td>${formatNumber(load.largestContentfulPaintMs)} ms</td></tr>`).join("\n");
  const localLoadNote = localMode
    ? "<p><strong>Local-mode note:</strong> page-transfer and loading figures are informational only. The old build is served by Next.js with compression, while the static export uses the minimal benchmark server. Use deployed-URL mode for hosting and bundle-delivery conclusions.</p>"
    : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PrivMeta branch benchmark</title><style>body{font:14px system-ui;max-width:1500px;margin:36px auto;padding:0 20px;color:#222}table{border-collapse:collapse;width:100%;margin:18px 0 32px}th,td{border:1px solid #ccc;padding:7px;text-align:right}th:first-child,td:first-child{text-align:left}.pass{color:#087830}.warn{color:#956400}.fail,.error{color:#b42318}section{border-top:1px solid #ddd;margin-top:18px}</style></head><body><h1>PrivMeta A/B benchmark</h1><p>Generated ${escapeHtml(new Date().toISOString())}. ${runCount} processing run${runCount === 1 ? "" : "s"} per fixture; timings are medians. JS heap is a sampled renderer metric, not total browser memory.</p><h2>Page loading</h2>${localLoadNote}<table><thead><tr><th>Version</th><th>Cold load</th><th>Warm load</th><th>Cold transfer</th><th>Warm transfer</th><th>Resources</th><th>FCP</th><th>LCP</th></tr></thead><tbody>${loadRows}</tbody></table><h2>Cleaning comparison</h2><table><thead><tr><th>Fixture</th><th>${escapeHtml(oldResult.variant.label)} privacy</th><th>${escapeHtml(newResult.variant.label)} privacy</th><th>Old time</th><th>New time</th><th>Time delta</th><th>Old output</th><th>New output</th><th>Old JS heap</th><th>New JS heap</th><th>Old max stall</th><th>New max stall</th></tr></thead><tbody>${rows}</tbody></table><h2>Warnings and errors</h2>${detailSections || "<p>None.</p>"}</body></html>`;
  fs.writeFileSync(path.join(reportDirectory, "report.html"), html);
}

test("compares the old and new cleaners with the same fixtures", async () => {
  resetReports();
  const fixtures = selectedFixtures();
  expect(fixtures.length, "No matching benchmark fixtures were found").toBeGreaterThan(0);
  const exifTool = resolveExifTool();
  const browser = await chromium.launch();
  const results: VariantResult[] = [];

  try {
    for (const variant of variants) {
      const load = await measurePageLoad(browser, variant.url);
      const cases: CaseBenchmark[] = [];
      for (const fixture of fixtures) {
        cases.push(await benchmarkFixture(browser, variant, fixture, exifTool));
      }
      results.push({ variant, load, cases });
    }
  } finally {
    await browser.close();
  }

  writeReport(results);
  const newFailures = results[1].cases.filter((item) => item.error || item.privacy?.status === "fail");
  expect(newFailures, `New-version failures. Open ${path.join(reportDirectory, "report.html")}`).toEqual([]);
});
