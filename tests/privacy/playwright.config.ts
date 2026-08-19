import { defineConfig } from "@playwright/test";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: __dirname,
  testMatch: "privacy.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 15 * 60 * 1000,
  expect: { timeout: 10_000 },
  outputDir: path.join(repositoryRoot, "test-results", "playwright"),
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
});
