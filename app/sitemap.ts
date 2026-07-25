import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getPostSlugs, postsDirectory } from "@/lib/blog";

export const dynamic = "error"; // 👈 Force static generation (no runtime)

const toDateString = (date: Date) => date.toISOString().split("T")[0];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.privmeta.com";

  // Read blog slugs at build time
  let blogPosts: MetadataRoute.Sitemap = [];

  try {
    blogPosts = getPostSlugs().map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: fs.statSync(path.join(postsDirectory, `${slug}.md`)).mtime,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error loading blog directory:", error);
  }

  const today = toDateString(new Date());

  // Your static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  return [...staticRoutes, ...blogPosts];
}
