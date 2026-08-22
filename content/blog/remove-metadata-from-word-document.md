---
title: "How to Remove Metadata from Word Documents"
description: "Remove document properties and author identities from Word documents in your browser. No file upload, free, and no account."
date: "2026-04-19"
---

Every Word document you create quietly stores information that has nothing to do with its content. When you save a `.docx` file, it records who wrote it, how many times it was revised, how long it was open, and often the name of the company whose Office licence was used to create it. None of this is visible when you open the document. All of it travels with the file when you share it.

How to remove metadata from a Word document is simpler than most people expect. This guide covers three approaches: in your browser (works on any device), on Mac, and on Windows.

## How to Remove Metadata from a Word Document in Your Browser

This method works on Mac, Windows, Chromebook, and other devices with a compatible browser. [PrivMeta](/) removes documented property and identity structures from your `.docx` file locally in your browser. The document bytes are not uploaded to a processing server.

1. Go to [PrivMeta](/)
2. Drop your `.docx` file into the upload area
3. Click **Remove metadata**
4. Download the cleaned file

The DOCX package is rebuilt while preserving its document parts. PrivMeta removes the `docProps/` folder and anonymises author/account attributes, revision dates and revision-session IDs throughout Word XML.

PrivMeta deliberately preserves visible comment text and tracked-change markup; it clears their author identities and dates rather than deleting editorial content. If you want comments gone or changes permanently accepted/rejected, do that in Word or another document editor before sharing.

## How to Remove Metadata from Word on Mac

On a Mac, you can use PrivMeta in Safari (the method above), or use Word's built-in tools.

**Using Document Inspector in Word for Mac:**

1. Open your document in Microsoft Word
2. Click the **Review** tab in the ribbon
3. Select **Check Document** to open the Document Inspector
4. Make sure **Document Properties and Personal Information** is checked
5. Click **Inspect**, then **Remove All** next to any categories with results
6. Save the document

The coverage of Word's built-in tools varies by version. PrivMeta provides a consistent documented target: package properties plus identity and revision-session attributes in Word XML. It does not claim to inspect the semantics of every embedded object or custom extension.

## How to Remove Metadata from Word on Windows

Windows users have access to Word's Document Inspector, which is more thorough than the Mac equivalent.

1. Open your document in Microsoft Word
2. Go to **File** then **Info**
3. Click **Check for Issues**, then **Inspect Document**
4. Ensure **Document Properties and Personal Information** is checked
5. Click **Inspect**
6. Click **Remove All** next to any categories showing results
7. Save the document

Word's inspector can remove common properties and can also offer separate controls for comments and tracked changes. PrivMeta is useful for consistently clearing package properties and author identities, but neither tool should be described as a universal guarantee for arbitrary embedded objects.

## What Metadata Does a Word Document Contain?

A DOCX file is a ZIP archive containing multiple XML files. Three of these store metadata:

**docProps/core.xml** contains the original author name, the name of the last person to edit the file, creation date, last modified date, and revision count (the number of times the file has been saved).

**docProps/app.xml** contains the application name and version used to create or edit the document (for example "Microsoft Office Word 16.0"), the company name from the Office licence, total editing time in minutes, word count, page count, and template name.

**docProps/custom.xml** contains any custom properties defined by you or your organisation, which can include anything from project codes to internal classifications.

### The fields most likely to cause problems

**Last Modified By** updates every time anyone saves the document. If a file has passed through several people, this field logs them in sequence. Sharing a document with this intact can reveal who handled it internally before it went out.

**Total Editing Time** shows how many minutes Word was open with that document loaded. In legal and professional contexts, this can indicate how carefully a document was reviewed, or how quickly it was signed off.

**Company Name** comes from the Office installation. A corporate licence means your organisation's name is embedded in every document you create. Sharing documents externally exposes this without any visible indication in the document itself.

**Tracked changes and comments** are stored separately from package properties. PrivMeta preserves their text and markup so cleaning does not silently change the editorial state, but removes recognised author/account attributes, dates and revision-session IDs. Accept all changes and delete comments manually if their content itself is sensitive.

### Why this has caused real problems

Document metadata has surfaced in legal cases, journalism, and business. Author names and timestamps have been used to challenge document authenticity. Revision histories have exposed internal deliberations that were never meant to be shared. Freelancers have inadvertently revealed how many internal drafts a proposal went through before it reached a client.

The risk is not dramatic in everyday situations. But the fix is quick and free, so there is no good reason not to do it before sharing sensitive documents.

## Remove the Metadata Before You Send

A useful precaution is to remove targeted document properties before the document leaves your device, then review the visible text, comments, tracked changes, embedded objects and filename yourself. [PrivMeta cleans documented Word metadata structures](/) in the browser without a file upload or account.

If you also work with PDFs, see our guide on [removing metadata from a PDF](/blog/remove-metadata-from-pdf-guide) for the same in-browser process.
