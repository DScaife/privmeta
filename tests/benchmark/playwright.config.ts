import { defineConfig } from "@playwright/test";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: __dirname,
  testMatch: "benchmark.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30 * 60 * 1000,
  expect: { timeout: 15_000 },
  outputDir: path.join(repositoryRoot, "test-results", "benchmark"),
  reporter: [["line"]],
  use: {
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
});
