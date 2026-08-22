import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

function readArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const equals = argument.indexOf("=");
    if (equals !== -1) {
      values[argument.slice(2, equals)] = argument.slice(equals + 1);
    } else {
      values[argument.slice(2)] = argv[index + 1];
      index++;
    }
  }
  return values;
}

function requireHttpUrl(value, name) {
  if (!value) throw new Error(`Missing --${name}=https://...`);
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`--${name} must use http:// or https://`);
  }
  return url.toString().replace(/\/$/, "");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false, ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

export async function runComparison(options) {
  const playwrightCli = path.join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
  const env = {
    ...process.env,
    PRIVMETA_BENCHMARK_OLD_URL: requireHttpUrl(options.old, "old"),
    PRIVMETA_BENCHMARK_NEW_URL: requireHttpUrl(options.new, "new"),
    PRIVMETA_BENCHMARK_OLD_LABEL: options["old-label"] || "master",
    PRIVMETA_BENCHMARK_NEW_LABEL: options["new-label"] || "cloudflare-migration",
    PRIVMETA_BENCHMARK_RUNS: options.runs || "3",
  };
  if (options.local) env.PRIVMETA_BENCHMARK_LOCAL = "1";
  if (options.fixtures) env.PRIVMETA_FIXTURES_DIR = options.fixtures;
  if (options.filter) env.PRIVMETA_BENCHMARK_FILTER = options.filter;

  await run(
    process.execPath,
    [playwrightCli, "test", "--config=tests/benchmark/playwright.config.ts"],
    { cwd: process.cwd(), env },
  );
}

const isEntryPoint = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isEntryPoint) {
  const options = readArguments(process.argv.slice(2));
  runComparison(options).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
