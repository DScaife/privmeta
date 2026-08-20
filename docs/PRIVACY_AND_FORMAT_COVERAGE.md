# Privacy model and metadata coverage

This document defines what PrivMeta's public privacy and metadata-removal
claims mean. It should be updated whenever a supported format or stripping
algorithm changes.

## Privacy boundary

File bytes are read and transformed by JavaScript in the user's browser. The
cleaning code does not upload file bytes to PrivMeta, Cloudflare, Sentry, or any
other service. The static site may still make ordinary network requests for
page assets and, when configured, privacy-conscious operational telemetry.
Those requests are separate from file processing and must not include file
contents or file names.

This boundary does not make a cleaned file anonymous. Visible or audible
content can reveal faces, voices, addresses, account names, landmarks, screen
content, or other personal information. The downloaded filename is derived
from the original filename, so users should rename it when the name itself is
sensitive.

## Supported formats and targeted structures

PrivMeta removes the structures listed below. “Supported” does not mean that
every possible private value in every valid or damaged file can be detected.

| Format | Removed or neutralised | Preserved / important limits |
|---|---|---|
| JPEG/JPG | EXIF and XMP APP1 segments, IPTC/Photoshop APP13 segments, comments | Compressed image data is copied losslessly. ICC colour profiles and unrecognised application segments are preserved. |
| PNG | Browser raster decode/re-encode to a new PNG | Intended for static PNG. Animated PNG is not guaranteed to remain animated; colour-profile behaviour depends on the browser. |
| WebP | Browser raster decode/re-encode, then EXIF/XMP/ICC chunk removal | Intended for static WebP. Animated WebP is not guaranteed to remain animated. |
| GIF | Comment extensions, XMP and non-rendering application extensions | Frames, timing, loop data and palette are copied without re-encoding. |
| PDF | Document Info fields, catalog XMP Metadata reference, trailer ID | Pages are reserialised. Visible text, annotations, forms, attachments and other document content are not redacted or inspected for personal information. |
| DOCX | `docProps/`; author/account attributes in Word XML; revision dates, durable IDs and `rsid` values | Visible document text, comment text and tracked-change markup are preserved. PrivMeta does not accept/reject tracked changes or delete comments. Other embedded files are not semantically inspected. |
| MP4, MOV, M4A | `udta`/`meta` boxes, creation/modification timestamps, Apple `meta` tracks and their sample payloads | Audio/video samples and box offsets are preserved. Classic and fragmented files are supported, including common movie-fragment-relative and explicit base addressing. Ambiguous metadata-track layouts fail safely. |
| WebM, MKV | Tags, Chapters, Attachments, writing/muxing app, track name and language | Encoded clusters are preserved. Known-size and schema-valid unknown-size live clusters are supported; other unknown-size layouts fail safely. |
| MP3 | Leading ID3v2 and conventional trailing ID3v1, ID3v1 Extended and APEv2 tags | MPEG audio frames are preserved. Tags in unusual locations are not guessed at. |
| AAC | Non-standard ID3/APE tags and a validated Libav encoder identifier in the first ADTS frame | Intended for raw ADTS AAC. Other ancillary payloads are preserved. |
| FLAC | Vorbis comments, pictures, application and padding blocks | Audio frames, STREAMINFO, SEEKTABLE and CUESHEET are preserved. Reserved/unknown block types are retained conservatively. |
| WAV | RIFF `LIST/INFO`, Broadcast Wave `bext`, and ID3 chunks | Audio and required technical chunks are preserved. Unknown RIFF chunks are retained conservatively and may contain application-specific data. |

AVI, OGG, HEIC/HEIF, TIFF, legacy `.doc`, and other unlisted formats are not
currently accepted.

## Failure behaviour

Container parsers validate lengths, offsets, sample tables and relevant schema
before mutation. When PrivMeta cannot establish safe bounds for a supported
file, it returns a failure in the UI instead of producing a guessed or partly
corrupted output. A successful result means the targeted structures were
processed; it is not a proof that the file contains no unknown metadata.

## Verification and confidence

The privacy regression suite sends fixtures through the production browser UI
and compares input and output with ExifTool. It also scans raw bytes for seeded
sentinels, checks important technical properties, validates document/container
structure, and asks Chromium to decode supported media.

Every supported format has a committed synthetic regression fixture. The suite
also generates real Chromium `MediaRecorder` WebM and fragmented MP4 files.
Additional private real-world fixtures can be run locally and are deliberately
ignored by Git. Real-world coverage is therefore useful but incomplete, and
public claims should describe tested structures rather than promise universal
removal.

## Rules for product claims

Public copy may say that file cleaning is client-side and that the cleaning
path does not upload file bytes. It should name supported formats and, where
space permits, link to this document.

Public copy should not claim “all metadata,” “completely private,” “anonymous,”
“no tracking,” guaranteed offline operation, or support for an unlisted format.
Operational telemetry must be described separately from file processing. A
change to a cleaner should update this matrix, its fixtures/policy, and any
format-specific article in the same pull request.

Run the suite with:

```bash
npm run privacy:test
```

See [`tests/privacy/README.md`](../tests/privacy/README.md) for fixture and CI
details.
