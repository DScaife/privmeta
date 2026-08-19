import { chromium, expect, test, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import {
  assessPrivacyCase,
  discoverFixtures,
  readMetadata,
  readTechnicalMetadata,
  resolveExifTool,
  validateDocumentIntegrity,
  validateWithExifTool,
  writeReports,
  type BrowserProbe,
  type PrivacyResult,
} from "./harness";
import { getPolicy } from "./policies";

const repositoryRoot = path.resolve(__dirname, "../..");
const fixtureRoots = [
  path.join(__dirname, "fixtures", "real"),
  path.join(__dirname, "fixtures", "synthetic"),
];
const reportDirectory = path.join(repositoryRoot, "privacy-results");
const staticOutputRoot = path.join(repositoryRoot, ".next-privacy");
const applicationUrl = "http://127.0.0.1:3100";
const fixtures = discoverFixtures(fixtureRoots);
let httpServer: Server | undefined;

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function buildStaticApplication(): void {
  const nextCli = path.join(repositoryRoot, "node_modules", "next", "dist", "bin", "next");
  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: repositoryRoot,
    env: { ...process.env, PRIVMETA_TEST: "1" },
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Static privacy build failed:\n${result.stdout}\n${result.stderr}`);
}

function resolveStaticPath(requestPath: string): string | null {
  const pathname = decodeURIComponent(requestPath.split("?")[0]);
  const relative = pathname.replace(/^\/+/, "");
  const candidates = relative
    ? [
        path.join(staticOutputRoot, relative),
        path.join(staticOutputRoot, `${relative}.html`),
        path.join(staticOutputRoot, relative, "index.html"),
      ]
    : [path.join(staticOutputRoot, "index.html")];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (
      !resolved.startsWith(`${path.resolve(staticOutputRoot)}${path.sep}`) &&
      resolved !== path.resolve(staticOutputRoot)
    ) {
      continue;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  }
  return null;
}

test.beforeAll(async () => {
  if (fixtures.length === 0) return;
  buildStaticApplication();
  httpServer = createServer((request, response) => {
    const filePath = resolveStaticPath(request.url ?? "/");
    if (!filePath) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.setHeader("Content-Type", contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream");
    fs.createReadStream(filePath).pipe(response);
  });
  await new Promise<void>((resolve, reject) => {
    httpServer?.once("error", reject);
    httpServer?.listen(3100, "127.0.0.1", resolve);
  });
});

test.afterAll(async () => {
  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer?.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

function resetReportDirectory(): void {
  const resolved = path.resolve(reportDirectory);
  const allowedPrefix = `${repositoryRoot}${path.sep}`;
  if (!resolved.startsWith(allowedPrefix) || path.basename(resolved) !== "privacy-results") {
    throw new Error(`Refusing to clear unexpected report directory: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(resolved, { recursive: true });
}

function safeCaseDirectory(id: string): string {
  const safeName = id.replace(/[^a-z0-9._-]+/gi, "_");
  return path.join(reportDirectory, "cases", safeName);
}

async function hydratedFileInput(page: Page) {
  const input = page.locator('input[type="file"]');
  await expect(input).toBeAttached();
  // The dedicated test server is ready before Playwright starts, but give the
  // client boundary one animation frame to attach its delegated event handler.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  return input;
}

async function cleanThroughUi(page: Page, inputPath: string, outputDirectory: string): Promise<string> {
  await page.goto("/");
  const input = await hydratedFileInput(page);
  await input.setInputFiles(inputPath);

  const removeButton = page.getByRole("button", { name: "Remove metadata" });
  await expect(removeButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await removeButton.click();
  const download = await downloadPromise;
  const failure = await download.failure();
  if (failure) throw new Error(`Browser download failed: ${failure}`);

  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, download.suggestedFilename());
  await download.saveAs(outputPath);
  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new Error("PrivMeta produced an empty or missing download");
  }
  return outputPath;
}

async function probeInBrowser(page: Page, filePath: string, kind: "image" | "video" | "audio" | "none"): Promise<BrowserProbe | undefined> {
  if (kind === "none") return undefined;
  await page.goto("/");
  await page.evaluate(() => {
    document.querySelector("#privacy-probe-input")?.remove();
    const input = document.createElement("input");
    input.type = "file";
    input.id = "privacy-probe-input";
    input.hidden = true;
    document.body.append(input);
  });
  await page.locator("#privacy-probe-input").setInputFiles(filePath);

  return page.evaluate(async (probeKind) => {
    const file = (document.querySelector("#privacy-probe-input") as HTMLInputElement | null)?.files?.[0];
    if (!file) return { supported: false, error: "File input did not contain the probe file" };

    const url = URL.createObjectURL(file);
    try {
      if (probeKind === "image") {
        const image = new Image();
        const loaded = new Promise<BrowserProbe>((resolve) => {
          image.onload = () => resolve({ supported: true, width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve({ supported: false, error: "Image decode failed" });
        });
        image.src = url;
        return await loaded;
      }

      const media = document.createElement(probeKind);
      media.preload = "metadata";
      const loaded = new Promise<BrowserProbe>((resolve) => {
        const timer = window.setTimeout(() => resolve({ supported: false, error: "Timed out loading media metadata" }), 15_000);
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
          resolve({ supported: false, error: media.error?.message || `Media error code ${media.error?.code ?? "unknown"}` });
        };
      });
      media.src = url;
      return await loaded;
    } finally {
      URL.revokeObjectURL(url);
    }
  }, kind);
}

test("all privacy fixtures are cleaned and remain usable", async () => {
  resetReportDirectory();
  if (fixtures.length === 0) {
    writeReports([], reportDirectory);
    test.skip(true, `No fixtures found. Add files beneath ${fixtureRoots[0]} or set PRIVMETA_FIXTURES_DIR.`);
  }

  const exifTool = resolveExifTool();
  const results: PrivacyResult[] = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true, baseURL: applicationUrl });
  const page = await context.newPage();

  try {
    for (const fixture of fixtures) {
      const caseDirectory = safeCaseDirectory(fixture.id);
      fs.mkdirSync(caseDirectory, { recursive: true });

      try {
        const beforeMetadata = readMetadata(exifTool, fixture.inputPath);
        const beforeTechnical = readTechnicalMetadata(exifTool, fixture.inputPath);
        fs.writeFileSync(path.join(caseDirectory, "before.exiftool.json"), `${JSON.stringify(beforeMetadata, null, 2)}\n`);

        const outputPath = await cleanThroughUi(page, fixture.inputPath, caseDirectory);
        const afterMetadata = readMetadata(exifTool, outputPath);
        const afterTechnical = readTechnicalMetadata(exifTool, outputPath);
        fs.writeFileSync(path.join(caseDirectory, "after.exiftool.json"), `${JSON.stringify(afterMetadata, null, 2)}\n`);

        const policy = getPolicy(fixture.extension);
        const browserBefore = await probeInBrowser(page, fixture.inputPath, policy.browserProbe);
        const browserAfter = await probeInBrowser(page, outputPath, policy.browserProbe);
        const documentValidation = await validateDocumentIntegrity(fixture.extension, fixture.inputPath, outputPath);

        results.push(
          assessPrivacyCase({
            fixture,
            outputPath,
            beforeMetadata,
            afterMetadata,
            beforeTechnical,
            afterTechnical,
            exifValidation: validateWithExifTool(exifTool, outputPath),
            browserBefore,
            browserAfter,
            documentValidation,
          }),
        );
      } catch (error) {
        results.push({
          id: fixture.id,
          extension: fixture.extension,
          inputPath: fixture.inputPath,
          status: "fail",
          removedTagCount: 0,
          forbiddenAfter: [],
          sentinelsFoundAfter: [],
          preserved: [],
          warnings: [],
          errors: [error instanceof Error ? error.message : String(error)],
          notes: fixture.overrides.notes,
        });
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  writeReports(results, reportDirectory);
  const failures = results.filter((result) => result.status === "fail");
  expect(failures, `Privacy failures. Open ${path.join(reportDirectory, "report.html")}`).toEqual([]);
});
