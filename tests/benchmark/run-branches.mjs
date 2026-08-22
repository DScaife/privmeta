import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runComparison } from "./run-comparison.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const equals = argument.indexOf("=");
    if (equals !== -1) values[argument.slice(2, equals)] = argument.slice(equals + 1);
    else {
      values[argument.slice(2)] = argv[index + 1];
      index++;
    }
  }
  return values;
}

function npmInvocation(args) {
  const npmCli = process.env.npm_execpath;
  if (npmCli && fs.existsSync(npmCli)) return { command: process.execPath, args: [npmCli, ...args] };
  return { command: process.platform === "win32" ? "npm.cmd" : "npm", args };
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit", shell: false });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? signal}`));
    });
  });
}

function runGit(args, cwd = repositoryRoot) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function startServer(command, args, cwd) {
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    detached: process.platform !== "win32",
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function waitForUrl(url, child, label) {
  const deadline = Date.now() + 120_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} server exited before becoming ready`);
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} server did not become ready: ${lastError instanceof Error ? lastError.message : "timeout"}`);
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  const baseline = options.baseline || "master";
  const currentLabel = runGit(["branch", "--show-current"]) || runGit(["rev-parse", "--short", "HEAD"]);
  const baselineCommit = runGit(["rev-parse", baseline]);
  const currentCommit = runGit(["rev-parse", "HEAD"]);
  console.log(`Comparing ${baseline} (${baselineCommit.slice(0, 8)}) with ${currentLabel} (${currentCommit.slice(0, 8)})`);

  const temporaryDirectory = path.resolve(os.tmpdir());
  const temporaryRoot = fs.mkdtempSync(path.join(temporaryDirectory, "privmeta-benchmark-"));
  const worktreePath = path.join(temporaryRoot, "baseline");
  if (
    path.dirname(temporaryRoot) !== temporaryDirectory ||
    !path.basename(temporaryRoot).startsWith("privmeta-benchmark-")
  ) {
    throw new Error("Invalid temporary benchmark path");
  }

  let oldServer;
  let newServer;
  let worktreeCreated = false;

  try {
    runGit(["worktree", "add", "--detach", worktreePath, baseline]);
    worktreeCreated = true;

    console.log(`Installing ${baseline} dependencies in the isolated worktree...`);
    const npmCi = npmInvocation(["ci"]);
    await run(npmCi.command, npmCi.args, worktreePath);
    console.log(`Building ${baseline}...`);
    const oldBuild = npmInvocation(["run", "build"]);
    await run(oldBuild.command, oldBuild.args, worktreePath);
    console.log(`Building ${currentLabel}...`);
    const newBuild = npmInvocation(["run", "build"]);
    await run(newBuild.command, newBuild.args, repositoryRoot);

    const oldStart = npmInvocation(["run", "start", "--", "-H", "127.0.0.1", "-p", "3101"]);
    oldServer = startServer(oldStart.command, oldStart.args, worktreePath);
    newServer = startServer(process.execPath, [path.join(repositoryRoot, "tests", "benchmark", "static-server.mjs"), path.join(repositoryRoot, "out"), "3102"], repositoryRoot);
    await Promise.all([
      waitForUrl("http://127.0.0.1:3101", oldServer, baseline),
      waitForUrl("http://127.0.0.1:3102", newServer, currentLabel),
    ]);

    await runComparison({
      old: "http://127.0.0.1:3101",
      new: "http://127.0.0.1:3102",
      "old-label": `${baseline}@${baselineCommit.slice(0, 8)}`,
      "new-label": `${currentLabel}@${currentCommit.slice(0, 8)}`,
      runs: options.runs || "3",
      fixtures: options.fixtures,
      filter: options.filter,
      local: "1",
    });
  } finally {
    await Promise.all([stopServer(oldServer), stopServer(newServer)]);
    if (worktreeCreated) {
      try {
        runGit(["worktree", "remove", "--force", worktreePath]);
      } catch (error) {
        console.warn(`Could not remove temporary worktree ${worktreePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (fs.existsSync(temporaryRoot)) {
      try {
        fs.rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
      } catch (error) {
        console.warn(`Could not fully remove temporary benchmark files: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
