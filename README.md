# PrivMeta

[PrivMeta](https://www.privmeta.com) is a free online metadata remover with a privacy focus. All file processing runs **entirely in the browser** — files are never uploaded to a server.

## Supported formats

| Type | Formats | How metadata is removed |
|------|---------|-------------------------|
| Images | JPEG, PNG, WebP | JPEG: lossless segment stripping (EXIF, XMP, IPTC, comments). PNG/WebP: canvas re-encode. |
| Animated | GIF | lossless block-level stripping (comments, XMP) - frames and palette untouched |
| Documents | PDF, DOCX | PDF: XMP, Info dictionary and /ID removed (pdf-lib). DOCX: docProps parts and thumbnail removed (jszip). |
| Video | MP4, WebM, AVI, MOV, MKV | ffmpeg.wasm stream copy, container metadata dropped |
| Audio | WAV, MP3, FLAC, AAC, OGG, M4A | ffmpeg.wasm stream copy, container metadata dropped |

The ffmpeg.wasm core is self-hosted (copied from `node_modules` to `public/ffmpeg/` by `scripts/copy-ffmpeg-core.mjs`, wired into `predev`/`prebuild`), so processing keeps working if the user goes offline after the page loads.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, fully static) + React
- Tailwind CSS v4, Radix UI, sonner
- pdf-lib, jszip, ffmpeg.wasm for client-side processing
- Markdown blog in `content/blog/` (gray-matter + remark, statically generated)
- Sentry for error reporting (console breadcrumbs and logs disabled so user file names never leave the device)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running the project with Docker

This project can also be built and run using **Docker Compose**.

### Build and start the container

Clone the repo and in the root of the project use this command when you have made code changes or when running for the first time:

```bash
docker compose up --build
```

### Start the container (without rebuilding)

Use this command for subsequent runs when no code changes were made:

```bash
docker compose up -d
```

This runs the container in detached mode.

### Stop the container

To stop the running service:

```bash
docker compose down
```
