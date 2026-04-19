---
title: "How to Remove Metadata from Word Documents"
description: "Remove hidden author names, revision history and tracked changes from Word documents in your browser. Your files never leave your device. Free, no account."
date: "2026-04-19"
---

Every Word document you create quietly stores information that has nothing to do with its content. When you save a `.docx` file, it records who wrote it, how many times it was revised, how long it was open, and often the name of the company whose Office licence was used to create it. None of this is visible when you open the document. All of it travels with the file when you share it.

How to remove metadata from a Word document is simpler than most people expect. This guide covers three approaches: in your browser (works on any device), on Mac, and on Windows.

## How to Remove Metadata from a Word Document in Your Browser

This method works on Mac, Windows, Chromebook, and any other device with a browser. [PrivMeta](/) strips all hidden metadata from your `.docx` file locally in your browser. Your document is never uploaded to a server.

1. Go to [PrivMeta](/)
2. Drop your `.docx` file into the upload area
3. Click **Remove metadata**
4. Download the cleaned file

The document's content, formatting, images, and layout are completely untouched. Only the hidden metadata is removed. The whole process takes around ten seconds and requires no software installation or account.

This is the most thorough option because it removes all three metadata files stored inside the DOCX format, not just the fields Word's own tools expose.

## How to Remove Metadata from Word on Mac

On a Mac, you can use PrivMeta in Safari (the method above), or use Word's built-in tools.

**Using Document Inspector in Word for Mac:**

1. Open your document in Microsoft Word
2. Click the **Review** tab in the ribbon
3. Select **Check Document** to open the Document Inspector
4. Make sure **Document Properties and Personal Information** is checked
5. Click **Inspect**, then **Remove All** next to any categories with results
6. Save the document

The limitation with Word's built-in tools on Mac is that coverage varies depending on your version of Word. Some fields, particularly those in the application properties file such as company name and total editing time, are not always removed cleanly. Using [PrivMeta](/) in Safari removes all three metadata files in the same amount of time, with no ambiguity about what was stripped.

## How to Remove Metadata from Word on Windows

Windows users have access to Word's Document Inspector, which is more thorough than the Mac equivalent.

1. Open your document in Microsoft Word
2. Go to **File** then **Info**
3. Click **Check for Issues**, then **Inspect Document**
4. Ensure **Document Properties and Personal Information** is checked
5. Click **Inspect**
6. Click **Remove All** next to any categories showing results
7. Save the document

This removes most common fields: author name, last modified by, comments, and document properties. For complete removal, particularly of fields like company name and total editing time, use [PrivMeta](/) before sending the document. It takes the same number of steps and guarantees all metadata files are cleared.

## What Metadata Does a Word Document Contain?

A DOCX file is a ZIP archive containing multiple XML files. Three of these store metadata:

**docProps/core.xml** contains the original author name, the name of the last person to edit the file, creation date, last modified date, and revision count (the number of times the file has been saved).

**docProps/app.xml** contains the application name and version used to create or edit the document (for example "Microsoft Office Word 16.0"), the company name from the Office licence, total editing time in minutes, word count, page count, and template name.

**docProps/custom.xml** contains any custom properties defined by you or your organisation, which can include anything from project codes to internal classifications.

### The fields most likely to cause problems

**Last Modified By** updates every time anyone saves the document. If a file has passed through several people, this field logs them in sequence. Sharing a document with this intact can reveal who handled it internally before it went out.

**Total Editing Time** shows how many minutes Word was open with that document loaded. In legal and professional contexts, this can indicate how carefully a document was reviewed, or how quickly it was signed off.

**Company Name** comes from the Office installation. A corporate licence means your organisation's name is embedded in every document you create. Sharing documents externally exposes this without any visible indication in the document itself.

**Tracked changes and comments** are stored separately from the metadata files above, but they are equally important to remove before sharing. Word's Document Inspector handles these, or you can accept all changes and delete all comments manually before saving a final version.

### Why this has caused real problems

Document metadata has surfaced in legal cases, journalism, and business. Author names and timestamps have been used to challenge document authenticity. Revision histories have exposed internal deliberations that were never meant to be shared. Freelancers have inadvertently revealed how many internal drafts a proposal went through before it reached a client.

The risk is not dramatic in everyday situations. But the fix is quick and free, so there is no good reason not to do it before sharing sensitive documents.

## Remove the Metadata Before You Send

The safest approach is to strip the metadata before the document leaves your device. [PrivMeta removes metadata from your Word documents](/) in your browser in seconds. Nothing is uploaded, no account is needed, and the cleaned document is ready to download immediately.

If you also work with PDFs, see our guide on [removing metadata from a PDF](/blog/remove-metadata-from-pdf-guide) for the same in-browser process.
