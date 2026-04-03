import Link from "next/link";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import matter from "gray-matter";
import fs from "fs";
import path from "path";
import type { Metadata } from "next";

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
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">PrivMeta Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights, tips, and best practices for maximising digital privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedPosts.map((post) => (
          <Card key={post.slug} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader>
              <h2 className="text-xl font-bold leading-snug">{post.title}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {post.readingTime} min read
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{post.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/blog/${post.slug}`}>
                  Read More <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
