# PrivMeta

[PrivMeta](https://www.privmeta.com) is a free, open-source metadata remover.
File bytes are processed in the browser and are not uploaded by the cleaning
code.

## Supported formats

| Type | Formats | Approach |
|---|---|---|
| Images | JPEG/JPG, PNG, WebP | Lossless segment removal for JPEG; browser raster re-encode for static PNG/WebP |
| Animated images | GIF | Lossless block-level removal; frames, timing and palette preserved |
| Documents | PDF, DOCX | Remove standard PDF properties/identifiers and DOCX package/author identities |
| Video | MP4, MOV, WebM, MKV | Format-specific ISO-BMFF and Matroska parsers; no transcoding |
| Audio | MP3, WAV, FLAC, AAC, M4A | Format-specific tag and container parsers; no transcoding |

AVI, OGG, HEIC/HEIF, TIFF and other unlisted formats are not currently
supported. Coverage is deliberately structure-specific rather than described
as “all metadata.” Read [the privacy model and format coverage](docs/PRIVACY_AND_FORMAT_COVERAGE.md)
for the exact removal targets, preservation behaviour and known limitations.

## Verification

The privacy regression harness drives the real browser UI, compares metadata
with ExifTool, scans for raw sentinel values, validates important format
properties and checks browser decoding. Run it locally with:

```bash
npm run privacy:test
```

It also runs in GitHub Actions for pull requests and pushes to `master`. See
[the harness documentation](tests/privacy/README.md) for setup and fixture
guidance.

## Tech stack

- [Next.js](https://nextjs.org) App Router with a fully static export
- React, Tailwind CSS, Radix UI and sonner
- `pdf-lib` and `jszip`, plus hand-written client-side format parsers
- Markdown blog content rendered with gray-matter and remark
- Optional Sentry and Cloudflare operational telemetry; file contents and file
  names must not be included

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

Build and start:

```bash
docker compose up --build
```

Start an existing build in the background:

```bash
docker compose up -d
```

Stop it:

```bash
docker compose down
```
