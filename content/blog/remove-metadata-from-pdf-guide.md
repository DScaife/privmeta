---
title: "How to Remove Metadata from a PDF. Free, No Software."
description: "Remove hidden author details, creation dates and document history from PDFs in your browser. Your files never leave your device. Free, no account."
date: "2026-04-19"
---

PDF files are rarely as clean as they look. Every PDF you create or export quietly stores a layer of invisible information: who made it, what software was used, when it was created, and sometimes much more. None of this is visible when someone opens the document. All of it travels with the file when you share it.

Remove metadata from a PDF before sending it and that hidden information stays private. This guide covers how to do it, what metadata PDFs actually contain, and why it matters.

## How to Remove Metadata from a PDF in Your Browser

[PrivMeta](/) removes PDF metadata directly in your browser. Your file is never uploaded to a server.

1. Go to [PrivMeta](/)
2. Drop your PDF into the upload area
3. Click **Remove metadata**
4. Download the cleaned file

The document's text, images, and layout are completely untouched. Only the hidden metadata is removed. The process takes a few seconds and requires no software installation or account.

PrivMeta removes both the Info dictionary (which stores author, title, subject, keywords, creator, and producer) and the XMP metadata stream. After processing, the PDF contains no identifiable metadata fields.

## What Metadata Does a PDF Contain?

PDF files store metadata in two places: the Info dictionary and the XMP stream. Both are invisible when you read the document normally, but readable by anyone who knows where to look.

**Author** is the full name registered to the software licence used to create the document. This is often a personal name pulled from a Microsoft Office or Adobe account.

**Creator application** is the software that produced the original document, for example "Microsoft Word 16.0" or "LibreOffice 7.5". This tells a reader exactly which application, and which version, was used.

**Producer** is the tool that converted the file to PDF. This may be different from the creator if the document was exported through a print driver or a separate converter.

**Creation date and modification date** are exact timestamps, often down to the second, recording when the file was first saved and when it was last changed.

**Title and subject** are often automatically populated from the document's file properties, which may contain internal project names or descriptions you never intended to share.

**Keywords** are any tags applied to the document, sometimes added automatically by document management systems.

**Company or organisation** is embedded automatically when the document was created using a corporate software licence.

**Document history** can include revision information or tracked changes inherited from the source document, a Word file for example, that were not properly removed before the PDF was exported.

If the PDF was created from a photo, such as a scanned document, it may also inherit GPS coordinates and device information from the original image's EXIF data.

## Does Removing PDF Metadata Affect the File?

No. The document's content is completely unaffected.

Metadata in a PDF is stored separately from the content layer. Text, images, tables, fonts, and layout are all held in a different part of the file structure. When metadata is removed, only those hidden property fields are cleared. Everything the reader sees stays exactly as it was.

File size decreases slightly because the metadata fields are no longer present, but this is negligible in practice.

## Why Removing PDF Metadata Matters

**Legal documents.** Legal and court documents often retain the author's name, revision timestamps, and creation software. In litigation, metadata is discoverable. It has been used to challenge document authenticity and to show that a file was altered after a specific date.

**CVs and job applications.** A CV created in Microsoft Word and exported as a PDF may carry the applicant's full name, the company they currently work for (pulled from their Office licence), and how long the document was open during editing. Sending this to a prospective employer shares context you may not have intended to include.

**Reports and client documents.** Reports sent to clients or published on a website often contain internal author names, draft timestamps, and company information that is irrelevant once the document leaves the organisation, and potentially sensitive.

**Academic submissions.** Universities and journals increasingly strip metadata before peer review to support blind reviewing. Cleaning your PDF before submission ensures the process works as intended.

**GDPR and data minimisation.** Under GDPR, the principle of data minimisation requires that personal data is not shared beyond what is necessary. Metadata embedded in PDFs often qualifies as personal data. Removing it before sharing documents is a straightforward step toward compliance.

**Software version disclosure.** The creator application field reveals exactly which software version produced the document. An outdated version of Word or Acrobat listed in a PDF's metadata tells an attacker which known vulnerabilities may apply to your systems. This is a minor but real exposure that takes seconds to close.

## Remove PDF Metadata Before You Share

The fastest and most private way to [remove metadata from your PDFs](/) is to do it in your browser before the file goes anywhere. PrivMeta handles this in seconds, with no upload, no account, and no software to install.

If you also work with Word documents, see our guide on [removing metadata from a Word document](/blog/remove-metadata-from-word-document) for the same in-browser process.

[Remove metadata from your PDF now.](/)
