import { getBlogArticleBySlug, getPublishedBlogArticles } from "@/lib/data/content";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);
  if (!article) return { title: "Not Found" };
  
  return {
    title: article.metaTitle || `${article.title} | Cars365 Blog`,
    description: article.metaDescription || article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);

  if (!article || article.status !== "published") {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:pt-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="size-4" /> Back to blog
        </Link>
        
        <div className="mb-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <time dateTime={article.publishedAt!}>
              {article.publishedAt ? formatDate(new Date(article.publishedAt), "MMMM d, yyyy") : ""}
            </time>
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {article.readingTimeMinutes} min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      {article.featuredImageUrl && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-12">
          <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted">
            <img 
              src={article.featuredImageUrl} 
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <article 
          className="prose prose-slate dark:prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>
    </div>
  );
}
