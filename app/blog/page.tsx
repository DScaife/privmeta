import Link from "next/link";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

// Define the type for a blog post
type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

export default function BlogPage() {
  // Get all blog posts
  const postsDirectory = path.join(process.cwd(), "content/blog");
  const filenames = fs.readdirSync(postsDirectory);

  const posts: BlogPost[] = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug: filename.replace(/\.md$/, ""),
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || "",
    };
  });

  // Sort posts by date
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl">PrivMeta Blog</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">Insights, tips, and best practices for maximising digital privacy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedPosts.map((post) => (
          <Card key={post.slug} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h2 className="text-2xl font-bold">{post.title}</h2>
              <p className="text-muted-foreground text-sm">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent>
              <p>{post.description}</p>
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
