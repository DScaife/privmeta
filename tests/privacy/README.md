# PrivMeta privacy regression harness

This suite sends each fixture through the real PrivMeta browser UI, downloads
the cleaned file, compares before/after metadata with ExifTool, scans for raw
sentinel strings, and checks that important technical properties survive.

## One-time setup

Install ExifTool and the Playwright Chromium browser:

```powershell
npm install
npm run privacy:install
```

If ExifTool is not on `PATH`, set its path before running the suite:

```powershell
$env:EXIFTOOL_PATH="C:\path\to\exiftool.exe"
```

## Adding fixtures

Place authentic files in the matching directory under `fixtures/real/`. Those
files are ignored by Git because they can contain names, identifiers, dates,
and precise locations. Do not put fixtures under `public/`; nothing in this
test directory is included in the Cloudflare export.

Synthetic, non-sensitive fixtures intended for source control can go under
`fixtures/synthetic/`.

The checked-in synthetic samples are deliberately seeded with recognizable
author, title, comment, software, GPS, document-property, audio-tag, and
container-tag values. To recreate or refresh those values and their
`.privacy.json` expectations, run:

```powershell
npm run privacy:seed
```

The command modifies the synthetic fixture files in place. It is deterministic
and safe to rerun: an immediate second run produces byte-identical fixtures.
It uses ExifTool for writable image/PDF/ISO media formats and local fixture-only
builders for ID3, FLAC, WAVE, DOCX, and Matroska metadata. These builders are
test tooling and are not included in the production application bundle.

The supported folders are:

```text
jpeg png webp gif pdf docx mp4 mov webm mkv mp3 aac flac wav m4a
```

Both `.jpg` and `.jpeg` files belong in `jpeg/`. Nested directories are fine.
Files ending in `_cleaned` are ignored so generated output cannot accidentally
become a new input.

An external fixture collection can be used without copying it into the repo:

```powershell
$env:PRIVMETA_FIXTURES_DIR="C:\Users\you\PrivMetaFixtures"
npm run privacy:test
```

## Optional per-file expectations

Add a JSON sidecar beside a fixture using the full filename plus
`.privacy.json`, for example `IMG_0740.MOV.privacy.json`:

```json
{
  "requiredBefore": ["*GPS*", "*SegmentIdentifier*"],
  "forbiddenAfter": ["*CustomPrivateTag*"],
  "preserveTags": ["Duration", "ImageSize", "Rotation"],
  "sentinels": ["PRIVMETA_TEST_PERSON_001"],
  "notes": "Original iPhone recording with location enabled"
}
```

Patterns are case-insensitive and `*` is a wildcard. `requiredBefore` prevents
a meaningless pass when a fixture never contained the intended metadata.
`forbiddenAfter` extends the format's default privacy policy. `preserveTags`
replaces the default preservation list for that fixture.

Synthetic metadata values beginning with `PRIVMETA_TEST_` are detected
automatically and must not appear anywhere in the cleaned bytes. Use these
sentinels whenever possible because they catch data ExifTool may not decode.

## Running

```powershell
npm run privacy:test
```

For visible browser automation:

```powershell
npm run privacy:test:headed
```

To create a non-sensitive real Chromium `MediaRecorder` WebM fixture with a
schema-verified unknown-size Cluster, run:

```powershell
npm run privacy:record-webm
```

To create a non-sensitive fragmented MP4 fixture from Chromium's H.264
`MediaRecorder`, with synthetic title, author, comment, and GPS metadata:

```bash
npm run privacy:record-mp4
```

Both generated browser fixtures are refreshed automatically by
`npm run privacy:test`. Their media is an animated canvas, not a camera or
screen capture, and the files remain ignored by Git with the other real
fixtures.

The generator records an animated canvas for five seconds, without camera,
microphone, or screen-capture permissions. It writes the result under
`fixtures/real/webm/` only after verifying the Segment and Cluster size VINTs.
The generated recording is ignored by Git like every other real fixture.

Reports and cleaned artifacts are written to `privacy-results/`:

```text
privacy-results/
  report.html
  report.md
  report.json
  cases/
    fixture-name/
      before.exiftool.json
      after.exiftool.json
      original_cleaned.ext
```

`FAIL` means metadata remained, a required input tag was absent, a preservation
property changed, or the output was invalid. `WARN` means the privacy rules
passed but the fixture lacked recognized metadata or the browser could not
decode a media codec. Warnings are kept visible without failing the command.

ExifTool is an independent metadata oracle, not the only oracle. Browser
decoding, PDF/DOCX structure checks, property preservation, and raw sentinel
scans complement it. Additional validators such as ffprobe can be added later
without affecting the deployed bundle.
