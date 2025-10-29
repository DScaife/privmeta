import type { Viewport, Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "PrivMeta — Remove Metadata from Files Privately",
  description:
    "PrivMeta is a free, privacy-first tool for removing metadata from images, PDFs, and documents. No uploads — everything happens locally in your browser.",
  keywords: [
    "private metadata remover",
    "remove metadata from files",
    "strip metadata",
    "delete metadata",
    "image metadata remover",
    "video metadata remover",
    "PDF metadata cleaner",
    "docx metadata removal",
    "remove EXIF data",
    "remove metadata from JPG",
    "clean metadata from PNG",
    "metadata remover MP4",
    "remove metadata from webm",
    "secure metadata remover",
    "open source metadata remover",
    "remove metadata online",
    "offline metadata tool",
    "browser-based metadata remover",
  ],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
  openGraph: {
    title: "PrivMeta — Remove Metadata from Files Privately",
    description: "Remove metadata from your files without uploading anything. PrivMeta is a free, offline-first tool for maximum privacy.",
    url: "https://www.privmeta.com/",
    siteName: "PrivMeta",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 628,
        alt: "PrivMeta - Remove Metadata from Files",
      },
    ],

    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrivMeta — Remove Metadata from Files Privately",
    description: "Remove metadata from images, PDFs, and documents. Free, private, and offline. Your files never leave your device.",
    images: ["/og-image.png"],
    creator: "@privmeta",
  },
  metadataBase: new URL("https://www.privmeta.com/"),
  authors: [{ name: "PrivMeta" }],
  creator: "PrivMeta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://www.privmeta.com/" />
        <script
          src="https://buglet.vercel.app/buglet.js"
          data-position="bottom-left"
          data-size="medium"
          data-primary-color="red"
          data-allowed-paths="/, /how-it-works"
          data-config-id="eixyyn1xgjyKsuZti7J1"
          defer
        ></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PrivMeta",
              url: "https://www.privmeta.com/",
              description: "Remove metadata from files with PrivMeta, a secure, offline-first tool for privacy-conscious users.",
            }),
          }}
        />
        <meta name="application-name" content="PrivMeta" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col">
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col flex-1">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Toaster richColors />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
