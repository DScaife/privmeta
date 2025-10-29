"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Shield, Server, FileText, FileImage, Film, File, HelpCircle, Paintbrush, ArrowRight } from "lucide-react";

const SeparatorSection = () => (
  <div className="w-full">
    <Separator />
  </div>
);

export default function HowItWorks() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[var(--max-content-width)] px-[var(--space-md)] flex flex-col gap-[var(--space-2xl)] py-[var(--space-2xl)]">
        <div className="flex flex-col gap-[var(--space-md)]">
          <h1 className="text-3xl font-bold mb-4">How PrivMeta Removes Metadata and Protects Your Privacy</h1>
          <p className="text-lg text-muted-foreground">
            Learn how our client-side technology removes metadata without compromising your files&apos; privacy
          </p>

          <div className="flex gap-[var(--space-md)] flex-wrap">
            <Badge variant="secondary">
              <Lock className="mr-1" size={16} /> Private Metadata Removal
            </Badge>
            <Badge variant="secondary">
              <Shield className="mr-1" size={16} /> Client-Side Security
            </Badge>
          </div>
        </div>

        <SeparatorSection />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-lg)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Server /> How It Works
              </CardTitle>
              <CardDescription>The private metadata removal process</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg">1. File Processing in Browser</h3>
                <p className="text-muted-foreground">
                  When you add files to PrivMeta, everything happens <strong>directly in your web browser</strong>. Your files never leave
                  your device or get uploaded to any server.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">2. Metadata Stripping</h3>
                <p className="text-muted-foreground">
                  Our specialized algorithms detect and remove metadata like location data, camera details, author information, and hidden
                  comments while preserving the core file content.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">3. Secure Download</h3>
                <p className="text-muted-foreground">
                  Cleaned files are immediately available for download as a ZIP archive. No copies are stored anywhere - we have no access
                  to your files at any point.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
                <FileText /> Why Remove Metadata?
              </CardTitle>
              <CardDescription>Protect your private information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Privacy Protection</h3>
                <p className="text-muted-foreground">
                  Metadata can contain sensitive information like GPS locations, device identifiers, and creation timestamps that reveal
                  more than you intend to share.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">Security Enhancement</h3>
                <p className="text-muted-foreground">
                  Hidden metadata can contain tracking information, hidden comments, or sensitive document properties that could compromise
                  security.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">Professional Publishing</h3>
                <p className="text-muted-foreground">
                  Remove confidential details from files before sharing them publicly or with clients to maintain professional standards.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File /> Supported File Types
            </CardTitle>
            <CardDescription>Private metadata removal for various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <FileImage /> Images: JPG, PNG, WEBP
              </div>
              <div className="flex items-center gap-2">
                <FileText /> Documents: PDF, DOCX
              </div>
              <div className="flex items-center gap-2">
                <Film /> Videos: MP4, MOV
              </div>
              <div className="flex items-center gap-2">
                <File /> More formats coming soon
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#245245] via-[#C57C5C] to-[#CAB796] p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#245245] via-[#C57C5C] to-[#CAB796]"></div>
          <div className="relative z-10">
            <Paintbrush className="h-12 w-12 text-white mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Remove Metadata Privately?</h3>
            <p className="text-blue-100 max-w-lg mx-auto mb-6">Try real privacy with our client-side metadata removal tool</p>
            <Button
              asChild
              className="bg-white text-black hover:bg-gray-100 font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <Link href="/">
                Remove Metadata Now
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="text-primary" /> Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">How does client-side metadata removal work?</h3>
              <p className="text-muted-foreground">
                All file processing happens directly in your web browser using JavaScript. When you add files, they&apos;re read by the
                browser and processed locally using specialized metadata stripping algorithms. No part of your file is ever sent to a
                server.
              </p>
            </div>

            <SeparatorSection />

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Is PrivMeta completely private?</h3>
              <p className="text-muted-foreground">
                Yes, PrivMeta was designed with privacy as the core principle. Since all processing happens in your browser, there are no
                server interactions with your files. You can even use it offline after the initial page load. The source code for PrivMeta
                is viewable on{" "}
                <a className="underline" href="https://github.com/DScaife/privmeta/tree/master" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </p>
            </div>

            <SeparatorSection />

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">What types of metadata does PrivMeta remove?</h3>
              <p className="text-muted-foreground">
                We remove EXIF data from images (location, camera settings), document metadata (author, revision history), PDF properties,
                and video metadata. Our algorithms target metadata while preserving essential file contents.
              </p>
            </div>
            <SeparatorSection />

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">How can I remove metadata from photos privately?</h3>
              <p className="text-muted-foreground">
                PrivMeta lets you remove EXIF data from JPG, PNG, and WEBP images directly in your browser. Simply add your photos, and
                we&apos;ll strip all metadata while keeping your images 100% private.
              </p>
            </div>

            <SeparatorSection />

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Is there a truly private way to clean document metadata?</h3>
              <p className="text-muted-foreground">
                Yes! PrivMeta removes metadata from PDFs and DOCX files entirely client-side. Unlike cloud-based tools, we never upload your
                sensitive documents to external servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
