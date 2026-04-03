---
title: "Remove Metadata from PDF: How to Strip Hidden PDF Data Privately"
description: "PDF files hide author names, software details, creation dates, and tracked changes inside their metadata. Learn how to remove PDF metadata privately without uploading your files to any server."
date: "2026-01-10"
---

PDF files are rarely as clean as they look. Behind the visible text and images, every PDF carries a layer of invisible metadata — and that metadata can reveal far more about you than you intended to share.

## What Metadata Is Hidden Inside PDFs?

When you create or save a PDF, your software automatically embeds details including:

- **Author name** — the full name registered to your software license
- **Creator application** — e.g. "Microsoft Word 16.0", "Adobe Acrobat Pro", "LibreOffice 7.5"
- **Producer application** — the tool that converted the file to PDF
- **Creation and modification dates** — exact timestamps down to the second
- **Document title and subject** — often auto-populated from file properties
- **Custom properties** — company name, department, or document tags added by your organisation

This information is invisible to anyone reading the PDF normally, but trivially easy to extract using free tools, or simply by opening the file's Document Properties panel.

## Why PDF Metadata Is a Genuine Privacy Risk

### Revealing the Wrong Software Version

If your PDF says it was created by an outdated version of Acrobat or Word, that tells an attacker exactly which known vulnerabilities might apply to your system.

### Exposing Internal Names and Structure

Documents shared externally often still carry the author's real name, their manager's name (via comments), or internal department identifiers. Whistleblowers, journalists, and legal professionals have been identified this way.

### Tracking Timelines

Creation and modification timestamps can prove when a document was drafted — information that may be legally or professionally sensitive.

### Version History Leaks

Some PDF workflows embed hidden revision history, tracked changes from the original Word or Google Docs source, or comments that were marked as resolved but never truly deleted.

## How to Remove Metadata from a PDF

### Option 1: PrivMeta (Private, No Upload Required)

PrivMeta strips PDF metadata entirely in your browser — no file ever leaves your device:

1. Go to [PrivMeta](/)
2. Drag and drop your PDF into the dropzone
3. Click **Remove metadata**
4. Download your cleaned PDF

PrivMeta removes the document's Info dictionary (title, author, subject, keywords, creator, producer) and the XMP metadata stream. The cleaned file contains no identifiable metadata fields.

### Option 2: Adobe Acrobat Pro

If you have Acrobat Pro, use **File → Properties → Description** to clear visible fields, then run **Tools → Redact → Sanitize Document** for a thorough clean. Note: this uploads nothing to Adobe servers when done in the desktop app.

### Option 3: Command Line (ExifTool)

For technical users:

```bash
exiftool -all= yourfile.pdf
```

This strips all metadata in place. Check the output with `exiftool yourfile.pdf` to verify.

## What Metadata Remains After Cleaning?

After running through PrivMeta, your PDF will have:

- No author, title, subject, or keyword fields
- No creator or producer application references
- No creation or modification timestamps
- No XMP metadata stream

The file content — text, images, layout — is preserved exactly as-is.

## When Should You Always Clean PDF Metadata?

- Before sending documents to clients or external parties
- When publishing PDFs on a website or public repository
- Before submitting documents to legal or regulatory bodies
- When sharing research, journalism, or sensitive internal reports
- Before attaching PDFs to emails on public mailing lists

## Try It Now

Remove PDF metadata privately — no account, no upload, no tracking.

[Clean Your PDF Now](/)
