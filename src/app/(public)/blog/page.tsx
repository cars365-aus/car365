import { getPublishedBlogArticles } from "@/lib/data/content";
import Link from "next/link";
import { formatDate } from "date-fns";
import { ArrowRight, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Blog | Cars365",
  description: "Read our latest articles, news, and tips on buying and maintaining used cars.",
};

export default async function BlogIndexPage() {
  const articles = await getPublishedBlogArticles();

    <>
      <SiteHeader />
      <div className="bg-background min-h-screen">
        <div className="bg-muted/30 py-16 sm:py-24 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-4">Cars365 Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Latest news, buying guides, and expert advice for navigating the used car market in Australia.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          {articles.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="mx-auto size-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold">No articles yet</h2>
              <p className="text-muted-foreground mt-2">Check back soon for our latest posts!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <article key={article.id} className="group relative flex flex-col items-start justify-between rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg transition-all">
                  {article.featuredImageUrl ? (
                    <div className="relative w-full h-48 sm:h-56 bg-muted overflow-hidden">
                      <img 
                        src={article.featuredImageUrl} 
                        alt={article.featuredImageAlt || article.title} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 sm:h-56 bg-muted flex items-center justify-center">
                      <BookOpen className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col h-full w-full">
                    <div className="flex items-center gap-x-4 text-xs mb-3">
                      <time dateTime={article.publishedAt!} className="text-muted-foreground">
                        {article.publishedAt ? formatDate(new Date(article.publishedAt), "MMM d, yyyy") : ""}
                      </time>
                      <span className="relative z-10 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/20">
                        {article.readingTimeMinutes} min read
                      </span>
                    </div>
                    <div className="group relative">
                      <h3 className="mt-3 text-lg font-bold leading-6 text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/blog/${article.slug}`}>
                          <span className="absolute inset-0" />
                          {article.title}
                        </Link>
                      </h3>
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {article.excerpt || article.body.replace(/<[^>]*>?/gm, '').substring(0, 150) + "..."}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                      Read article <ArrowRight className="size-4" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
      <SiteFooter />
    </>
}
