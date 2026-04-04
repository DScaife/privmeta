import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Shield, Server, FileText, FileImage, Film, File, HelpCircle, ArrowRight } from "lucide-react";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
  title: "How PrivMeta Works — Private, Client-Side Metadata Removal",
  description:
    "Learn how PrivMeta removes metadata from photos, PDFs, videos, and documents entirely in your browser. No uploads, no servers — complete privacy guaranteed.",
  alternates: { canonical: "https://www.privmeta.com/how-it-works" },
  openGraph: {
    title: "How PrivMeta Works — Private, Client-Side Metadata Removal",
    description:
      "Learn how PrivMeta removes metadata from photos, PDFs, videos, and documents entirely in your browser. No uploads, no servers — complete privacy guaranteed.",
    url: "https://www.privmeta.com/how-it-works",
    siteName: "PrivMeta",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 628, alt: "How PrivMeta Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How PrivMeta Works — Private, Client-Side Metadata Removal",
    description: "No uploads, no servers. PrivMeta strips metadata from your files entirely in your browser.",
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
    <div className="w-full flex flex-col gap-(--space-xl) sm:gap-(--space-2xl) md:gap-(--space-3xl) py-(--space-lg) sm:py-(--space-3xl) md:py-(--space-2xl)">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Header */}
      <div className="flex flex-col gap-(--space-lg)">
        <Typography as="h1" variant="h1">
          How PrivMeta removes metadata and protects your privacy
        </Typography>
        <Typography variant="bodyLg" muted>
          Learn how our client-side technology removes metadata without compromising your files&apos; privacy
        </Typography>
        <div className="flex gap-(--space-lg) flex-wrap">
          <div className="flex items-center gap-(--space-sm)">
            <Lock size={14} />
            <Typography variant="label">Private Metadata Removal</Typography>
          </div>
          <div className="flex items-center gap-(--space-sm)">
            <Shield size={14} />
            <Typography variant="label">Client-Side Security</Typography>
          </div>
        </div>
      </div>

      <Divider />

      {/* How It Works + Why Remove Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-lg)">
        <div className="flex flex-col gap-(--space-lg) border border-border rounded-xl p-(--space-xl)">
          <div className="flex flex-col gap-(--space-sm)">
            <div className="flex items-center gap-(--space-sm)">
              <Server size={16} />
              <Typography as="h2" variant="h2">
                How It Works
              </Typography>
            </div>
            <Typography variant="label" muted>
              The private metadata removal process
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-lg)">
            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                1. File Processing in Browser
              </Typography>
              <Typography variant="body" muted>
                When you add files to PrivMeta, everything happens <strong>directly in your web browser</strong>. Your files never leave
                your device or get uploaded to any server.
              </Typography>
            </div>

            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                2. Metadata Stripping
              </Typography>
              <Typography variant="body" muted>
                Our specialized algorithms detect and remove metadata like location data, camera details, author information, and hidden
                comments while preserving the core file content.
              </Typography>
            </div>

            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                3. Secure Download
              </Typography>
              <Typography variant="body" muted>
                Cleaned files are immediately available for download as a ZIP archive. No copies are stored anywhere — we have no access
                to your files at any point.
              </Typography>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-(--space-lg) border border-border rounded-xl p-(--space-xl)">
          <div className="flex flex-col gap-(--space-sm)">
            <div className="flex items-center gap-(--space-sm)">
              <FileText size={16} />
              <Typography as="h2" variant="h2">
                Why Remove Metadata?
              </Typography>
            </div>
            <Typography variant="label" muted>
              Protect your private information
            </Typography>
          </div>

          <div className="flex flex-col gap-(--space-lg)">
            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                Privacy Protection
              </Typography>
              <Typography variant="body" muted>
                Metadata can contain sensitive information like GPS locations, device identifiers, and creation timestamps that reveal
                more than you intend to share.
              </Typography>
            </div>

            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                Security Enhancement
              </Typography>
              <Typography variant="body" muted>
                Hidden metadata can contain tracking information, hidden comments, or sensitive document properties that could compromise
                security.
              </Typography>
            </div>

            <div className="flex flex-col gap-(--space-sm)">
              <Typography as="h3" variant="body" weight={600}>
                Professional Publishing
              </Typography>
              <Typography variant="body" muted>
                Remove confidential details from files before sharing them publicly or with clients to maintain professional standards.
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Supported File Types */}
      <div className="flex flex-col gap-(--space-lg) border border-border rounded-xl p-(--space-xl)">
        <div className="flex items-center gap-(--space-sm)">
          <File size={16} />
          <Typography as="h2" variant="h2">
            Supported File Types
          </Typography>
        </div>
        <Typography variant="label" muted>
          Private metadata removal for various formats
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-(--space-lg)">
          <div className="flex items-center gap-(--space-sm)">
            <FileImage size={16} />
            <Typography variant="body">Images: JPG, PNG, WEBP, GIF</Typography>
          </div>
          <div className="flex items-center gap-(--space-sm)">
            <FileText size={16} />
            <Typography variant="body">Documents: PDF, DOCX</Typography>
          </div>
          <div className="flex items-center gap-(--space-sm)">
            <Film size={16} />
            <Typography variant="body">Videos: MP4, MOV, MKV, AVI, WEBM</Typography>
          </div>
          <div className="flex items-center gap-(--space-sm)">
            <File size={16} />
            <Typography variant="body">Audio: MP3, WAV, FLAC, AAC, OGG, M4A</Typography>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-foreground p-(--space-3xl) flex flex-col items-center gap-(--space-lg)">
        <Typography as="h3" variant="h2" className="text-background text-center">
          Ready to Remove Metadata Privately?
        </Typography>
        <Typography variant="bodyLg" className="text-background/70 text-center max-w-lg">
          Try real privacy with our client-side metadata removal tool
        </Typography>
        <Button asChild size="lg" variant="secondary" className="type-fluid type-button-lg">
          <Link href="/">
            Remove Metadata Now
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <Divider />

      {/* FAQ */}
      <div className="flex flex-col gap-(--space-2xl)">
        <div className="flex items-center gap-(--space-sm)">
          <HelpCircle size={20} />
          <Typography as="h2" variant="h1">
            Frequently Asked Questions
          </Typography>
        </div>

        <div className="flex flex-col gap-(--space-2xl)">
          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              How does client-side metadata removal work?
            </Typography>
            <Typography variant="body" muted>
              All file processing happens directly in your web browser using JavaScript. When you add files, they&apos;re read by the
              browser and processed locally using specialized metadata stripping algorithms. No part of your file is ever sent to a server.
            </Typography>
          </div>

          <Divider />

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Is PrivMeta completely private?
            </Typography>
            <Typography variant="body" muted>
              Yes, PrivMeta was designed with privacy as the core principle. Since all processing happens in your browser, there are no
              server interactions with your files. You can even use it offline after the initial page load. The source code for PrivMeta
              is viewable on{" "}
              <a className="underline" href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Typography>
          </div>

          <Divider />

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              What types of metadata does PrivMeta remove?
            </Typography>
            <Typography variant="body" muted>
              We remove EXIF data from images (location, camera settings), document metadata (author, revision history), PDF properties,
              and video metadata. Our algorithms target metadata while preserving essential file contents.
            </Typography>
          </div>

          <Divider />

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              How can I remove metadata from photos privately?
            </Typography>
            <Typography variant="body" muted>
              PrivMeta lets you remove EXIF data from JPG, PNG, and WEBP images directly in your browser. Simply add your photos, and
              we&apos;ll strip all metadata while keeping your images 100% private.
            </Typography>
          </div>

          <Divider />

          <div className="flex flex-col gap-(--space-sm)">
            <Typography as="h3" variant="bodyLg" weight={600}>
              Is there a truly private way to clean document metadata?
            </Typography>
            <Typography variant="body" muted>
              Yes! PrivMeta removes metadata from PDFs and DOCX files entirely client-side. Unlike cloud-based tools, we never upload your
              sensitive documents to external servers.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}
