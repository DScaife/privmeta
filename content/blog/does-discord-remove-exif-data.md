---
title: "Does Discord Remove EXIF Data? Do Not Rely on It."
description: "Discord may omit common EXIF from processed images, but that is not a privacy guarantee. Learn what can vary and how to check a file before sharing."
date: "2026-04-19"
---

**Discord commonly serves processed image copies without the original photo's EXIF data, but you should not rely on Discord to remove it for you.** Behaviour can vary with the client, file format, upload route, and future platform changes. More importantly, the original file has already left your device before Discord can process it.

If location, device, creator, or timestamp fields are sensitive, remove and inspect them before uploading.

## Does Discord Strip EXIF from Uploaded Images?

Images displayed through Discord are often processed for delivery through its media infrastructure. A downloaded or proxied representation may therefore differ from the file selected on your device, and common EXIF fields may no longer be present.

That observation is not the same as a documented privacy guarantee:

- Discord supports several clients and upload paths.
- A transformed image representation is not necessarily the only copy received or retained by the service.
- Files sent as attachments may be handled differently from images rendered inline.
- Platform behaviour can change after an app or infrastructure update.

Discord's [privacy policy](https://discord.com/privacy/) describes uploaded attachments as content provided to the service. It does not promise that every upload method strips every EXIF, XMP, IPTC, comment, or application-specific metadata structure before the file is received.

The practical answer is therefore: Discord may remove common metadata from the copy another user downloads, but that should not be your metadata-removal step.

## What Could Be Exposed in the Original Photo?

A camera or phone image can contain:

- GPS latitude, longitude, and altitude
- Capture date, time, and time-zone details
- Phone or camera make and model
- Lens and exposure settings
- Editing software
- Creator and copyright fields
- XMP, IPTC, comments, and embedded previews

Not every photo contains every field. The only reliable way to know what a particular file contains is to inspect that file.

## Why Downloading the Discord Copy Is Not Enough

Suppose you upload a JPEG, download the displayed Discord copy, and find no EXIF. That establishes something useful about the delivered copy in that test. It does not establish that:

- The original upload contained no metadata
- Discord never received the original metadata
- Every Discord client and file type behaves identically
- A future upload will follow the same processing path

This distinction matters when the privacy objective is to avoid transmitting location or identity data in the first place.

## How to Test Discord's Current Behaviour

You can repeat this test with a non-sensitive fixture:

1. Create or copy an image containing obvious test metadata, such as a fake creator name and non-sensitive GPS coordinates.
2. Inspect the original with ExifTool and save the output.
3. Upload it through the Discord client and method you actually use.
4. Download the file or displayed image from a second account or browser session.
5. Run ExifTool on the downloaded copy.
6. Compare the results, file hashes, dimensions, and file type.

Record the client, operating system, upload method, file format, and test date. A result only describes that specific path at that time.

## Remove Metadata Before Uploading to Discord

[PrivMeta](/) removes the EXIF, XMP, IPTC and comment structures targeted by its image cleaners in your browser. Photo bytes are not uploaded to a processing server.

**Supported formats:** JPEG, JPG, PNG, WEBP, and GIF

1. Open [PrivMeta](/).
2. Add the photo.
3. Select **Remove metadata**.
4. Download the cleaned file.
5. Inspect it if the context is sensitive, then upload that copy to Discord.

For a complete walkthrough, see [how to remove metadata from photos](/blog/how-to-strip-metadata-from-photos). You can also read [what EXIF data contains](/blog/what-is-exif-data).

## What Cleaning Does Not Protect

Removing file metadata does not hide information visible in the picture. Faces, usernames, addresses, screens, reflections, documents, and landmarks still require review. Discord also necessarily receives ordinary service information associated with an upload, such as account, network, and usage data described in its privacy policy.

## The Safest Conclusion

Do not ask whether Discord will clean a sensitive original after you send it. Clean and inspect the copy first, while the file is still under your control.

[Remove documented photo metadata with PrivMeta](/) before your next upload. No account or file-processing upload is required.
