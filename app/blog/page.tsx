import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import Typography from "@/components/Typography";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Privacy Blog - Metadata Guides & Tips | PrivMeta",
  description:
    "Learn how to protect your privacy by removing metadata from photos, PDFs, videos, and documents. Practical guides and tips from the PrivMeta team.",
  alternates: { canonical: "https://www.privmeta.com/blog" },
  openGraph: {
    title: "Privacy Blog - Metadata Guides & Tips | PrivMeta",
    description:
      "Learn how to protect your privacy by removing metadata from photos, PDFs, videos, and documents. Practical guides and tips from the PrivMeta team.",
    url: "https://www.privmeta.com/blog",
    siteName: "PrivMeta",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 628, alt: "PrivMeta Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Blog - Metadata Guides & Tips | PrivMeta",
    description: "Practical guides on removing metadata and protecting your digital privacy.",
    images: ["/og-image.png"],
  },
};

const Divider = () => <div className="h-0.75 w-full bg-foreground" />;

export default function BlogPage() {
  const sortedPosts = getAllPosts();

  return (
    <div className="w-full flex flex-col gap-(--fluid-xl-3xl) py-(--fluid-lg-3xl)">
      <section className="w-full">
        <Typography as="h1" variant="hero">
          Guides on metadata, privacy, and digital hygiene.
        </Typography>
      </section>

      <div className="flex flex-col gap-(--space-lg)">
        {sortedPosts.map((post, index) => (
          <React.Fragment key={post.slug}>
            {index > 0 && <Divider />}
            <Link href={`/blog/${post.slug}`} prefetch={false} className="group flex flex-col gap-(--space-lg) py-(--fluid-xl-2xl)">
              <Typography variant="label" muted>
                {post.date
                  ? new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}{" "}
                · {post.readingTime} min read
              </Typography>
              <Typography as="h2" variant="bodyLg" weight={600} className="group-hover:underline underline-offset-4">
                {post.title}
              </Typography>
              <Typography variant="body" muted>
                {post.description}
              </Typography>
            </Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
