import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export const dynamic = "error"; // 👈 Force static generation (no runtime)

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.privmeta.com/";

  // Read blog slugs at build time
  const postsDir = path.join(process.cwd(), "content/blog");
  let blogPosts: MetadataRoute.Sitemap = [];

  try {
    const filenames = fs.readdirSync(postsDir);

    blogPosts = filenames.map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(postsDir, filename);

      return {
        url: `${baseUrl}/blog/${slug}`,
        lastModified: fs.statSync(filePath).mtime,
        changeFrequency: "weekly",
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error("Error loading blog directory:", error);
  }

  // Your static routes
const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  return [...staticRoutes, ...blogPosts];
}
