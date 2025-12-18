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

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  contentHtml: string;
};

export async function generateMetadata() {
  return {
    title: `Blog | Buglet`,
    description: `Insights and best practices about user feedback and bug reporting`,
  };
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
    ...matterResult.data,
  } as BlogPost;
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
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
