import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
  title: "How PrivMeta Works — In-Browser Metadata Removal, No Uploads",
  description:
    "Remove metadata from photos, PDFs, videos, and audio directly in your browser — no upload, no account. Your files never leave your device. Try it free.",
  alternates: { canonical: "https://www.privmeta.com/how-it-works" },
  openGraph: {
    title: "Remove Metadata from Files — Free, In-Browser | PrivMeta",
    description:
      "Remove metadata from photos, PDFs, videos, and audio directly in your browser — no upload, no account. Your files never leave your device. Try it free.",
    url: "https://www.privmeta.com/how-it-works",
    siteName: "PrivMeta",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 628, alt: "How PrivMeta Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How PrivMeta Works — In-Browser Metadata Removal, No Uploads",
    description: "Strip metadata from photos, PDFs, videos, and audio entirely in your browser. No uploads. No account. Free.",
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
      name: "Is PrivMeta completely private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, PrivMeta was designed with privacy as the core principle. Since all processing happens in your browser, there are no server interactions with your files. You can even use it offline after the initial page load.",
      },
    },
    {
      "@type": "Question",
      name: "What types of metadata does PrivMeta remove?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We remove EXIF data from images (location, camera settings), document metadata (author, revision history), PDF properties, and video/audio metadata. Our algorithms target metadata while preserving essential file contents.",
      },
    },
    {
      "@type": "Question",
      name: "How can I remove metadata from photos privately?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PrivMeta lets you remove EXIF data from JPG, PNG, GIF, and WEBP images directly in your browser. Simply add your photos, and we'll strip all metadata while keeping your images 100% private.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a truly private way to clean document metadata?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! PrivMeta removes metadata from PDFs and DOCX files entirely client-side. Unlike cloud-based tools, we never upload your sensitive documents to external servers.",
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
          Every file you share carries hidden data. PrivMeta strips it out entirely in your browser, before anything leaves your device.
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
                The app reads them directly in your browser. Nothing is uploaded or sent to a server — ever.
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
                Location, camera details, author info, revision history — removed from the file while the content itself is preserved.
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
              MP4, MOV, MKV, AVI, WEBM
            </Typography>
          </div>
          <div className="flex flex-col gap-(--space-sm)">
            <Typography variant="label">Audio</Typography>
            <Typography variant="body" muted>
              MP3, WAV, FLAC, AAC, OGG, M4A
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
              Is PrivMeta completely private?
            </Typography>
            <Typography variant="body" muted>
              Yes. Since all processing happens in your browser, there are no server interactions with your files. You can even use it
              offline after the initial page load. The source code is viewable on{" "}
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
              EXIF data from images (location, camera settings), document properties (author, revision history), PDF metadata, and
              video/audio tags. The algorithm targets metadata while preserving the file content itself.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              How can I remove metadata from photos privately?
            </Typography>
            <Typography variant="body" muted>
              Add your JPG, PNG, or WEBP image to the dropzone. PrivMeta strips the EXIF data — including GPS coordinates and device info —
              and returns a clean file, directly in your browser.
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Is there a private way to clean document metadata?
            </Typography>
            <Typography variant="body" muted>
              Yes. PrivMeta processes PDFs and DOCX files entirely in your browser. Unlike cloud tools, your documents are never uploaded to
              external servers.
            </Typography>
          </div>
        </div>
      </section>
    </div>
  );
}
