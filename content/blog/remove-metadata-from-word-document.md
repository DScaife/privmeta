---
title: "Remove Metadata from Word Docs — No Install"
description: "Strip hidden author names, edit history, and company data from Word documents — free, in your browser. No install, no upload. Try it free — no sign-up needed."
date: "2026-01-20"
---

You can remove all hidden metadata from a Word document in seconds — no software to install, no file upload required. [PrivMeta](/) processes your `.docx` entirely in your browser, so your document never leaves your device.

Word files are not as simple as they look. Every document you create quietly accumulates a record of who wrote it, when, on which machine, and sometimes what was written and then deleted along the way.

## What Metadata Does a DOCX File Contain?

A DOCX file is actually a ZIP archive containing multiple XML files. Among those files, three store metadata specifically:

- **`docProps/core.xml`** — author name, last modified by, creation date, modification date, revision count
- **`docProps/app.xml`** — application name and version (e.g. "Microsoft Office Word"), company name from your Office licence, total editing time in minutes, word count, page count, template name
- **`docProps/custom.xml`** — any custom document properties set by you or your organisation

### The "Last Modified By" Problem

One of the most commonly overlooked fields is **Last Modified By**. Even if a document was originally authored by someone else, this field updates to your name every time you save it — silently logging that the file passed through your hands.

### Editing Time

The **Total Editing Time** field tracks how many minutes Word has been open with that document. This can reveal how much attention you gave a document, which may be professionally or legally relevant.

### Company Name

If you installed Microsoft Office with a corporate licence, your company name is typically embedded in `docProps/app.xml`. Sharing a document externally can expose this.

## Real-World Risks

**Legal discovery**: In litigation, metadata is discoverable. Timestamps and author fields have been used to challenge document authenticity and expose unauthorised edits.

**Journalism and whistleblowing**: Several high-profile leaks have been traced back to document metadata revealing who prepared or accessed a file.

**Competitive intelligence**: Sharing a proposal with a client may also share your internal revision history, word count, and editor names.

## How to Remove Metadata from a DOCX File

### Option 1: PrivMeta — Free, In-Browser, No Install

[PrivMeta](/) removes all three metadata XML files from your DOCX entirely in your browser — no account, no installation, nothing uploaded to a server:

1. Visit [PrivMeta](/)
2. Drop your `.docx` file into the upload area
3. Click **Remove metadata**
4. Download the cleaned file

The document content, formatting, and structure remain completely intact. Only the hidden metadata files are removed.

### Option 2: Microsoft Word's Built-In Inspector

Word has a Document Inspector that can find and remove metadata:

1. Go to **File → Info → Check for Issues → Inspect Document**
2. Select the categories you want to inspect (Document Properties, Hidden Text, etc.)
3. Click **Inspect**, then **Remove All** next to each category

**Limitation**: Word's inspector may miss some fields and requires you to trust Microsoft's implementation. It also doesn't work on files you open briefly without saving.

### Option 3: Manual Inspection

Because DOCX is a ZIP format, you can open it with any ZIP utility and delete the `docProps/` folder manually. This is what PrivMeta does programmatically.

## What Does a Cleaned DOCX Look Like?

After processing with PrivMeta:

- `docProps/core.xml` is removed — no author, dates, or revision count
- `docProps/app.xml` is removed — no application name, company, or edit time
- `docProps/custom.xml` is removed — no custom properties
- The document body, styles, images, and formatting are untouched

## Who Should Clean DOCX Metadata?

- **Legal professionals** sharing documents with opposing counsel or courts
- **Freelancers** sending proposals to clients
- **Journalists** protecting source identities
- **Businesses** sharing templates or contracts externally
- **Anyone** submitting documents for academic or public review

If you also need to clean PDF files, see our guide on [removing metadata from PDFs](/blog/remove-metadata-from-pdf-guide) — the same in-browser process, nothing uploaded.

## Try It Now

Unlike Word's built-in inspector or any desktop tool, [PrivMeta](/) requires no installation and nothing is ever uploaded — your documents stay on your device throughout.

Strip hidden data from your Word documents — free, private, and completely in your browser.

[Remove DOCX Metadata Now](/)
