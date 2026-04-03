---
title: "Remove Metadata from Word Documents: Strip Hidden Data from DOCX Files"
description: "Microsoft Word documents silently store your name, edit history, tracked changes, and company details. Learn how to remove hidden metadata from DOCX files before sharing them."
date: "2026-01-20"
---

Every Word document you create is quietly building a record about you. Long after you've finished writing, the file carries hidden details about who wrote it, when, on which machine, and sometimes even what was written and deleted along the way.

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

### Option 1: PrivMeta (No Upload, Fully Private)

PrivMeta removes all three metadata XML files from your DOCX in-browser:

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

## Try It Now

Strip hidden data from your Word documents — free, private, and completely in your browser.

[Remove DOCX Metadata Now](/)
