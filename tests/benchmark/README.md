# PrivMeta A/B benchmark

This suite compares two complete PrivMeta builds with exactly the same fixture files. It records:

- privacy-policy and ExifTool validation results;
- browser decode/playback integrity and preserved technical fields;
- median click-to-completed-download time;
- output size;
- sampled Chromium renderer JS heap;
- the largest observed main-thread timer gap;
- cold/warm page-load time, transferred bytes, FCP and LCP.

The heap figure is not total process memory: WebAssembly, canvas surfaces, browser processes and some Blob storage may live outside the JavaScript heap. Treat it as a comparative signal, not a memory ceiling. Browser and network timings are inherently noisy, so use at least three runs and compare medians.

Local branch mode is authoritative for cleaner correctness and processing comparisons. Its page-load figures are informational because the old build uses Next.js's compressed production server while the static export uses a minimal local file server. Use deployed-URL mode for meaningful CDN, transfer-size and hosting comparisons.

## Compare deployed versions

The benchmark code only needs to exist in the current checkout. It drives both applications from the outside through their file inputs and download UI.

```powershell
npm run benchmark:compare -- --old=https://www.privmeta.com --new=https://YOUR-WORKER.workers.dev --old-label=Vercel-master --new-label=Cloudflare-migration --runs=5
```

This mode includes real CDN, network and hosting differences. Run it more than once if comparing page-load timings.

## Compare local branches without switching

```powershell
npm run benchmark:branches -- --baseline=master --runs=3
```

The command:

1. creates a detached temporary `master` worktree in the operating system's temporary directory;
2. runs `npm ci` there so the FFmpeg dependencies remain isolated;
3. builds both versions;
4. serves the old Next.js application on port 3101 and the new static export on port 3102;
5. runs one Playwright comparison against both;
6. stops both servers and removes the temporary worktree.

Your active branch and working files are never checked out, reset or replaced. Reports remain in `benchmark-results/`.

## Narrow or customize a run

Use a regular expression against fixture IDs:

```powershell
npm run benchmark:branches -- --filter="mp4|mov|webm|mkv" --runs=5
```

Use a separate fixture tree:

```powershell
npm run benchmark:branches -- --fixtures="C:\path\to\fixtures" --runs=3
```

The fixture tree uses the same file and optional `.privacy.json` sidecar format documented in `tests/privacy/README.md`.

## Reading the result

Open `benchmark-results/report.html`. The JSON source is `benchmark-results/report.json`.

The old version is allowed to fail the current privacy policy so regressions and improvements remain visible. The command fails if the new version cannot process a fixture or produces an output that fails the current privacy/integrity policy.

AVI and OGG are not in the shared benchmark because the migration version no longer advertises those formats. Record that as a format-coverage difference rather than a performance result.
