---
title: "Free Open Source Metadata Remover. PrivMeta"
description: "Open source lets you inspect a metadata remover's design and self-host it. PrivMeta's code and coverage limits are public on GitHub."
date: "2026-04-14"
---

When you use a tool to remove sensitive data from your files, you're placing a lot of trust in that tool. How do you know it's actually stripping the metadata and not uploading your files to a server somewhere? With a closed-source tool, you can't. You're taking the developer's word for it.

Open source gives you substantially more evidence to evaluate, although source availability alone is not a guarantee.

PrivMeta is a free, open-source metadata remover whose file-cleaning path runs in your browser. Add a supported file, remove documented metadata structures, and download the result without a file upload or account.

## What "Open Source" Actually Means for a Privacy Tool

Open source means the source code is publicly available. Anyone can read it, inspect the intended behaviour, run the tests, and build it independently. For a privacy tool that handles sensitive files, that evidence matters.

PrivMeta's source code is [on GitHub](https://github.com/DScaife/privmeta/tree/master). You, or a developer you trust, can audit the cleaning path, run its regression suite, and self-host a reviewed build. A hosted deployment still requires trust that the served build matches the published source.

## Three Things You Can Verify in the Code

**1. File bytes are not uploaded for processing**

PrivMeta processes file bytes using JavaScript running directly in your browser tab. There is no file-processing API or upload endpoint. Like most websites, the deployed page can still request static assets and may use configured operational telemetry; the auditable boundary is that those requests do not receive file contents or file names.

**2. Metadata is actually removed**

Different file types need different approaches. For images, PrivMeta removes targeted EXIF, IPTC, XMP and comment structures. For DOCX files, it removes `docProps/` and anonymises author, account and revision-session identities throughout Word XML. Audio and video use hand-written format parsers for MP4/MOV/M4A, Matroska, MP3/AAC tags, FLAC and WAV. The code and exact [coverage limitations](https://github.com/DScaife/privmeta/blob/master/docs/PRIVACY_AND_FORMAT_COVERAGE.md) are readable on GitHub.

**3. The telemetry boundary**

Some tools make broad privacy claims without distinguishing file processing from website telemetry. PrivMeta's source lets you verify both: optional Sentry and Cloudflare telemetry may make ordinary operational requests, while the cleaning path does not upload file contents or file names.

## Who This Matters For

Open source is especially important for people with higher-stakes privacy needs:

**Journalists and researchers** working with sensitive documents need to know that removing identifying information from a source's file actually removes it, not that the tool says it does.

**Activists and whistleblowers** need to be able to verify, or have a trusted technical contact verify, that a tool is safe to use before trusting it with files that could identify people.

**Developers and security professionals** routinely audit tools before recommending them to clients or colleagues. A closed-source metadata remover is a black box; an open-source one is an auditable system.

**Privacy-conscious users** who simply want to understand what a piece of software does before trusting it with their personal files.

## Open Source + Client-Side: Why the Combination Matters

Open source and client-side processing are a particularly powerful combination for a metadata remover.

If an open-source tool processed files on a server, you would also have to trust the unseen server deployment. Client-side processing removes that file-processing server from the path and makes browser network activity inspectable. It does not prove automatically that a hosted bundle matches a repository commit, which is why self-hosting remains an option for higher-assurance use.

This is the core design decision behind PrivMeta: the code is public, and the processing happens where you can see it.

## How to Use This Open Source Metadata Remover

No account or installation needed:

1. Go to [PrivMeta](/)
2. Drop your files into the dropzone
3. Click **Remove metadata**
4. Download the cleaned files

PrivMeta supports batch processing. You can drop multiple files at once and download them as a ZIP; the files are cleaned and bundled in the browser.

## Supported File Types

PrivMeta removes metadata from:

- **Images**: JPEG, PNG, static WEBP, and GIF
- **Documents**: PDF and DOCX
- **Video**: MP4, MOV, MKV, and WEBM
- **Audio**: MP3, WAV, FLAC, raw AAC, and M4A

Coverage is structure-specific. A successful clean is not a promise that visible content, filenames, or every unknown application-specific field is anonymous.

## A Note on Trust in Privacy Tools

The privacy tool space has a recurring pattern: services that handle sensitive files and make strong privacy claims, but operate as closed-source cloud products. You upload your file, they process it server-side, and you receive a cleaned version. The claim is that nothing is retained. The reality is that you cannot verify this.

Open source doesn't automatically make a tool trustworthy. The code still needs to be well-written and actively maintained. But it is a necessary baseline for serious privacy use cases. It shifts the question from "do you trust this company's privacy policy?" to "can you read the code?"

PrivMeta was built with this in mind. File cleaning is local, the code and tests are public, and no account is required. Ordinary hosting and operational telemetry still exist and are documented separately from file processing.

## Try It Now

[Remove metadata from your files, free, open source, entirely in your browser.](/)
