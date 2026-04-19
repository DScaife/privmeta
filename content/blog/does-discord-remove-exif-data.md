---
title: "Does Discord Remove EXIF Data from Photos? And Instagram?"
description: "Most platforms strip some photo metadata, but behaviour varies and cannot be verified. Remove it yourself before sharing. Your files never leave your device."
date: "2026-04-19"
---

When you share a photo on Discord, Instagram, or WhatsApp, something happens to its metadata. The question is exactly what, and whether you can rely on it.

Every photo contains EXIF data: GPS coordinates, device make and model, timestamps, and lens details, all embedded invisibly in the file. Whether a platform removes this data when you upload a photo varies by platform, by file type, and sometimes by client. The answer is often "mostly, in most cases" rather than a clean yes or no.

For anyone concerned about the privacy of their photos, "mostly" is not good enough.

## Does Discord Remove EXIF Data from Photos?

Discord strips EXIF metadata from images uploaded via the desktop and mobile apps in most cases. When you drag an image into a Discord message and send it, the version Discord serves from its CDN typically has the metadata removed.

However, this behaviour is not consistent across all file types and upload methods. Files shared as attachments rather than inline images may behave differently. Discord's handling of metadata is also not formally documented as a privacy guarantee, which means it could change without notice.

At the time of writing, most Discord image uploads do appear to result in stripped EXIF data. But you have no way to verify this before the file leaves your device, and no way to confirm it after.

## Does Instagram Remove EXIF Data from Photos?

Instagram strips EXIF metadata from photos at upload. This has been consistent behaviour for some years and is well documented by independent researchers who have analysed uploaded images.

Instagram also recompresses images significantly, which removes most embedded data as a side effect of the compression process.

That said, the metadata is transmitted to Instagram's servers as part of the original upload before any stripping takes place. Instagram's privacy policy determines what happens to that data once received. Removing the metadata before uploading means Instagram never receives it in the first place.

## Does WhatsApp Remove Metadata from Photos?

WhatsApp compresses images sent as photos through the app, which typically removes EXIF data in the process. If you send an image using the "Document" option rather than the photo option, the file is sent without compression, which may preserve its original metadata intact.

End to end encryption means the content of WhatsApp messages is not accessible to Meta in transit. However, metadata about messages (who sent what, to whom, and when) is a separate matter from the EXIF data embedded within a photo. For photos sent as documents rather than images, assume the EXIF data remains unless you have removed it yourself.

## Does Facebook Remove Metadata from Photos?

Facebook strips EXIF data from photos uploaded to the platform, including GPS coordinates. Like Instagram, it also recompresses images, which removes most embedded metadata as a side effect.

The original file with all its metadata is still transmitted to Facebook's servers at upload before any stripping occurs.

## Why Platform Stripping Is Not Enough

Even if most platforms remove EXIF data most of the time, relying on them to do it is a poor substitute for removing it yourself. There are several reasons for this.

**You cannot verify it happened.** Once a photo is uploaded, you have no independent way to confirm that the platform removed the metadata as expected. You are taking their behaviour on trust.

**Platform behaviour changes without notice.** App updates, infrastructure changes, and policy shifts can all affect how metadata is handled. A platform that strips EXIF today may not behave identically in six months, and they have no obligation to inform users when behaviour changes.

**The metadata is transmitted before stripping.** When you upload a photo, the full original file is sent to the platform's servers first. Any metadata removal happens on the server after the fact. The data has already left your device.

**Not all sharing methods are equal.** Some platforms only strip metadata from images displayed in the feed. Sharing a file as a direct attachment, sending a download link, or exporting content may preserve the original file with metadata intact.

**You only get one chance.** If you share a photo with a geotag to the wrong person or in the wrong context, you cannot un-share the location data once it has been seen.

Stripping the metadata yourself before uploading eliminates all of these uncertainties. The platform never receives the metadata because it was not in the file you sent.

## How to Remove Metadata Before Sharing

[PrivMeta](/) removes all EXIF data from your photos in your browser before you share them. Your photos are never uploaded to a server.

**Supported formats:** JPEG, JPG, PNG, WEBP, GIF

1. Go to [PrivMeta](/)
2. Drop your photo into the upload area
3. Click **Remove metadata**
4. Download the cleaned file
5. Share that file wherever you like

The image looks identical. The hidden data is gone. It takes a few seconds and works on any device including iPhone, Android, Mac, and Windows.

For a full guide on what photo metadata contains and how to remove it across different devices, see our post on [removing metadata from photos](/blog/remove-metadata-from-photos). To understand exactly what EXIF fields your photos carry, see our guide on [what EXIF data is](/blog/what-is-exif-data).

## Remove It Yourself. Know It Is Done.

Platform behaviour is inconsistent, undocumented, and outside your control. The only method that guarantees your photo metadata is gone before sharing is removing it yourself, before the file goes anywhere.

[Strip EXIF data from your photos at PrivMeta](/) before your next upload. Free, no account, nothing sent to a server.
