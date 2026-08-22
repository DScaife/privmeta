import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
  title: "How it Works - Private Metadata Removal",
  description: "See how PrivMeta removes targeted metadata from supported files in your browser, with no account or file upload.",
  alternates: { canonical: "https://www.privmeta.com/how-it-works" },
  openGraph: {
    title: "How it Works - Private Metadata Removal",
    description: "See how PrivMeta removes targeted metadata from supported files in your browser, with no account or file upload.",
    url: "https://www.privmeta.com/how-it-works",
    siteName: "PrivMeta",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 628, alt: "How PrivMeta Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How it Works - Private Metadata Removal",
    description: "See how PrivMeta removes targeted metadata from supported files in your browser, with no account or file upload.",
    images: ["/og-image.png"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does client-side metadata removal work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All file processing happens directly in your web browser using JavaScript. When you add files, they're read by the browser and processed locally using specialized metadata stripping algorithms. No part of your file is ever sent to a server.",
      },
    },
    {
      "@type": "Question",
      name: "Are my files uploaded?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. File bytes are read and cleaned in your browser and are not sent to PrivMeta, Cloudflare, Sentry, or another processing service. The website may still make ordinary requests for page assets and operational telemetry, but those requests do not include your file contents or file names.",
      },
    },
    {
      "@type": "Question",
      name: "What types of metadata does PrivMeta remove?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PrivMeta targets documented metadata structures for each supported format: image EXIF/XMP/IPTC, standard PDF properties, DOCX package and author identities, common audio tags, and MP4/MOV or Matroska container metadata. Exact coverage and limitations are documented publicly.",
      },
    },
    {
      "@type": "Question",
      name: "How can I remove metadata from photos privately?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PrivMeta removes EXIF, XMP, IPTC and comment structures targeted by its JPG, PNG, GIF and WebP cleaners. JPEG image data and GIF frames are copied without re-encoding; static PNG and WebP images are raster re-encoded by the browser.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a truly private way to clean document metadata?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PrivMeta removes standard PDF properties and identifiers, plus DOCX document properties and author/account identities, entirely client-side. It does not redact visible document content; DOCX comment text and tracked-change markup are intentionally preserved.",
      },
    },
    {
      "@type": "Question",
      name: "Does a successful clean guarantee that a file is anonymous?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. PrivMeta removes the documented structures it recognises, but visible or audible content, filenames, unknown metadata structures, comments, and other application-specific data may still identify someone. Review sensitive files before sharing them.",
      },
    },
  ],
};

const Divider = () => <div className="h-0.75 w-full bg-foreground" />;

export default function HowItWorks() {
  return (
    <div className="w-full flex flex-col gap-(--fluid-xl-3xl) py-(--fluid-lg-3xl)">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="w-full">
        <Typography as="h1" variant="hero">
          PrivMeta removes targeted privacy-sensitive metadata in your browser, before your file is shared.
        </Typography>
      </section>

      {/* Steps */}
      <section className="w-full flex flex-col gap-(--space-2xl)">
        <Typography as="h2" variant="label" muted>
          How it works
        </Typography>
        <div className="flex flex-col gap-(--fluid-2xl-3xl)">
          <div className="flex gap-(--space-xl)">
            <Typography variant="label" muted className="shrink-0 w-8">
              01
            </Typography>
            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="bodyLg" weight={600}>
                Drop your files.
              </Typography>
              <Typography variant="body" muted>
                The app reads them directly in your browser. File bytes are not uploaded or sent to a processing server.
              </Typography>
            </div>
          </div>

          <div className="flex gap-(--space-xl)">
            <Typography variant="label" muted className="shrink-0 w-8">
              02
            </Typography>
            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="bodyLg" weight={600}>
                Metadata is stripped.
              </Typography>
              <Typography variant="body" muted>
                Recognised location, camera, author, document-property and media-tag structures are removed while essential file content is
                preserved.
              </Typography>
            </div>
          </div>

          <div className="flex gap-(--space-xl)">
            <Typography variant="label" muted className="shrink-0 w-8">
              03
            </Typography>
            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="bodyLg" weight={600}>
                Download the cleaned file.
              </Typography>
              <Typography variant="body" muted>
                Single files download directly. Multiple files are bundled into a ZIP. No copies stored, no access retained.
              </Typography>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full flex flex-col gap-(--space-lg)">
        <Typography as="h2" variant="label" muted>
          Coverage and limitations
        </Typography>
        <Typography variant="body" muted>
          Metadata formats are extensible, so no tool can safely promise that every unknown field in every file is gone. PrivMeta removes
          documented structures for each supported format and fails instead of guessing when a container cannot be parsed safely. It does
          not redact visible or audible content. DOCX comment text and tracked-change markup are preserved, although their author identities,
          dates and revision-session IDs are cleaned.
        </Typography>
        <Typography variant="body" muted>
          The exact removal targets, preservation behaviour, test evidence and known limitations are documented in the project&apos;s{" "}
          <a
            className="underline"
            href="https://github.com/DScaife/privmeta/blob/master/docs/PRIVACY_AND_FORMAT_COVERAGE.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            format coverage audit
          </a>
          .
        </Typography>
      </section>

      <Divider />

      {/* Supported formats */}
      <section className="w-full flex flex-col gap-(--space-lg)">
        <Typography as="h2" variant="label" muted>
          Supported formats
        </Typography>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-(--space-lg)">
          <div className="flex flex-col gap-(--space-sm)">
            <Typography variant="label">Images</Typography>
            <Typography variant="body" muted>
              JPG, PNG, WEBP, GIF
            </Typography>
          </div>
          <div className="flex flex-col gap-(--space-sm)">
            <Typography variant="label">Documents</Typography>
            <Typography variant="body" muted>
              PDF, DOCX
            </Typography>
          </div>
          <div className="flex flex-col gap-(--space-sm)">
            <Typography variant="label">Video</Typography>
            <Typography variant="body" muted>
              MP4, MOV, MKV, WEBM
            </Typography>
          </div>
          <div className="flex flex-col gap-(--space-sm)">
            <Typography variant="label">Audio</Typography>
            <Typography variant="body" muted>
              MP3, WAV, FLAC, AAC, M4A
            </Typography>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full rounded-xl bg-foreground p-(--space-3xl) flex flex-col items-center gap-(--space-lg) text-center">
        <Typography as="p" variant="hero" className="text-background">
          Try it now. No sign-up, no upload, no catch.
        </Typography>
        <Button asChild size="lg" variant="secondary" className="type-fluid type-button-lg">
          <Link href="/">
            Remove metadata
            <ArrowRight />
          </Link>
        </Button>
      </section>

      {/* FAQ */}
      <section className="w-full flex flex-col gap-(--space-2xl)">
        <Typography as="h2" variant="label" muted>
          Frequently asked questions
        </Typography>

        <div className="flex flex-col gap-(--space-3xl)">
          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              How does client-side metadata removal work?
            </Typography>
            <Typography variant="body" muted>
              All file processing happens directly in your web browser using JavaScript. When you add files, they&apos;re read locally and
              processed using specialised metadata stripping algorithms. No part of your file is ever sent to a server.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Are my files uploaded?
            </Typography>
            <Typography variant="body" muted>
              No. File bytes are read and cleaned in your browser and are not sent to a processing server. The site may still make ordinary
              requests for page assets and operational telemetry, but those requests do not include file contents or file names. The source
              code is viewable on{" "}
              <a className="underline" href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              .
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              What types of metadata does PrivMeta remove?
            </Typography>
            <Typography variant="body" muted>
              PrivMeta targets documented structures for each format: image EXIF/XMP/IPTC, standard PDF properties, DOCX package and author
              identities, common audio tags, and MP4/MOV or Matroska container metadata. See the coverage audit above for exact details.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              How can I remove metadata from photos privately?
            </Typography>
            <Typography variant="body" muted>
              Add a JPG, PNG, WEBP or GIF image to the dropzone. PrivMeta removes the metadata structures targeted for that format, including
              common GPS and device fields, and returns the result directly in your browser.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Is there a private way to clean document metadata?
            </Typography>
            <Typography variant="body" muted>
              Yes. PrivMeta processes PDFs and DOCX files entirely in your browser. It removes standard PDF properties and DOCX document
              properties and author identities. It does not redact visible content, and it preserves DOCX comments and tracked-change markup.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Does a successful clean guarantee that a file is anonymous?
            </Typography>
            <Typography variant="body" muted>
              No. Visible images, text, voices, filenames and unknown application-specific structures can still identify someone. PrivMeta
              verifies the metadata structures it targets; you should still review sensitive content and rename sensitive filenames before
              sharing.
            </Typography>
          </div>
        </div>
      </section>
    </div>
  );
}
