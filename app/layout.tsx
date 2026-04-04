import type { Viewport, Metadata } from "next";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import "./globals.css";

const avenirNext = localFont({
  variable: "--font-avenir",
  display: "swap",
  src: [
    {
      path: "../public/fonts/avenir-next-ultralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-demibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

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
    "remove metadata from image",
    "remove metadata from photo",
    "remove metadata from pdf",
    "remove metadata from video",
    "remove metadata from png",
    "remove metadata from jpg",
    "remove EXIF data",
    "strip metadata online",
    "metadata remover free",
    "private metadata removal",
    "remove metadata without uploading",
    "what is metadata",
    "metadata login",
    "metadata account",
    "AI metadata",
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
  alternates: {
    canonical: "https://www.privmeta.com/",
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "PrivMeta",
              url: "https://www.privmeta.com/",
              logo: {
                "@type": "ImageObject",
                url: "https://www.privmeta.com/PrivMetaLogoIconLightMode.png",
              },
              image: "https://www.privmeta.com/og-image.png",
              description: "Remove metadata from files with PrivMeta, a secure, offline-first tool for privacy-conscious users.",
              foundingDate: "2025-01-01",
              applicationCategory: "WebApplication",
              operatingSystem: "All",
              creator: {
                "@type": "Organization",
                name: "PrivMeta",
                url: "https://www.privmeta.com/",
                logo: "https://www.privmeta.com/PrivMetaLogoIconLightMode.png",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
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

      <body suppressHydrationWarning className={`antialiased min-h-screen flex flex-col ${avenirNext.variable} font-avenir`}>
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <div className="flex flex-col flex-1 items-center">
              <div className="max-w-(--max-content-width) flex flex-col flex-1 w-full h-full px-(--space-xl)">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Toaster richColors />
                <Footer />
                <SideNav />
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
