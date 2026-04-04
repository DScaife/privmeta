import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";
import Link from "next/link";
import type { Metadata } from "next";
import Typography from "@/components/Typography";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  contentHtml: string;
  readingTime: number;
};

function estimateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

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
    readingTime: estimateReadingTime(matterResult.content),
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.privmeta.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.privmeta.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="w-full flex flex-col gap-(--space-xl) sm:gap-(--space-2xl) md:gap-(--space-3xl) py-(--space-lg) sm:py-(--space-3xl) md:py-(--space-2xl)">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/blog">Blog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Post header */}
      <div className="flex flex-col gap-(--space-md)">
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
        <Typography as="h1" variant="h1">
          {post.title}
        </Typography>
      </div>

      <div className="h-0.75 w-full bg-foreground" />

      {/* Article content */}
      <article className="w-full max-w-none prose prose-lg" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </div>
  );
}
