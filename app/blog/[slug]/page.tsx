import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  contentHtml: string;
};

async function getPostData(slug: string): Promise<BlogPost> {
  const fullPath = path.join(process.cwd(), "content/blog", `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  const processedContent = await remark().use(remarkGfm).use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    title: matterResult.data.title || "",
    description: matterResult.data.description || "",
    date: matterResult.data.date || "",
  };
}

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), "content/blog");
  const filenames = fs.readdirSync(postsDirectory);
  return filenames.map((filename) => ({ slug: filename.replace(/\.md$/, "") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostData(slug);
  const url = `https://www.privmeta.com/blog/${slug}`;

  return {
    title: `${post.title} | PrivMeta Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "PrivMeta",
      type: "article",
      publishedTime: post.date,
      authors: ["PrivMeta"],
      images: [{ url: "/og-image.png", width: 1200, height: 628, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/og-image.png"],
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostData(slug);
  const url = `https://www.privmeta.com/blog/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url,
    author: { "@type": "Organization", name: "PrivMeta", url: "https://www.privmeta.com/" },
    publisher: { "@type": "Organization", name: "PrivMeta", url: "https://www.privmeta.com/" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/blog" className="flex items-center">
            <ArrowLeft size={16} className="mr-2" /> Back to Blog
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </CardHeader>

        <CardContent className="max-w-none">
          <article className="article prose prose-lg" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </CardContent>
      </Card>
    </div>
  );
}
