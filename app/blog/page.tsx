import React from "react";
import Link from "next/link";
import matter from "gray-matter";
import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
  title: "Privacy Blog — Metadata Guides & Tips | PrivMeta",
  description:
    "Learn how to protect your privacy by removing metadata from photos, PDFs, videos, and documents. Practical guides and tips from the PrivMeta team.",
  alternates: { canonical: "https://www.privmeta.com/blog" },
  openGraph: {
    title: "Privacy Blog — Metadata Guides & Tips | PrivMeta",
    description:
      "Learn how to protect your privacy by removing metadata from photos, PDFs, videos, and documents. Practical guides and tips from the PrivMeta team.",
    url: "https://www.privmeta.com/blog",
    siteName: "PrivMeta",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 628, alt: "PrivMeta Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Blog — Metadata Guides & Tips | PrivMeta",
    description: "Practical guides on removing metadata and protecting your digital privacy.",
    images: ["/og-image.png"],
  },
};

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: number;
};

function estimateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

const Divider = () => <div className="h-0.75 w-full bg-foreground" />;

export default function BlogPage() {
  const postsDirectory = path.join(process.cwd(), "content/blog");
  const filenames = fs.readdirSync(postsDirectory);

  const posts: BlogPost[] = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug: filename.replace(/\.md$/, ""),
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || "",
      readingTime: estimateReadingTime(content),
    };
  });

  const sortedPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="w-full flex flex-col gap-(--space-xl) sm:gap-(--space-2xl) md:gap-(--space-3xl) py-(--space-lg) sm:py-(--space-3xl) md:py-(--space-2xl)">
      <section className="w-full">
        <Typography as="h1" variant="hero">
          Guides on metadata, privacy, and digital hygiene.
        </Typography>
      </section>

      <div className="flex flex-col gap-(--space-lg)">
        {sortedPosts.map((post, index) => (
          <React.Fragment key={post.slug}>
            {index > 0 && <Divider />}
            <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-(--space-lg) py-(--space-xl) sm:py-(--space-2xl)">
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
