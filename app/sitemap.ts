import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "error"; // 👈 Force static generation (no runtime)

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.privmeta.com";

  // Read blog slugs at build time
  let blogPosts: MetadataRoute.Sitemap = [];

  try {
    blogPosts = getAllPosts().map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated || post.date,
    }));
  } catch (error) {
    console.error("Error loading blog directory:", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
    },
    {
      url: `${baseUrl}/blog`,
    },
    {
      url: `${baseUrl}/how-it-works`,
    },
  ];

  return [...staticRoutes, ...blogPosts];
}
