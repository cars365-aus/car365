import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedArticles } from "@/lib/blog/queries";
import { buildCollectionPageSchema, serializeSchemas } from "@/lib/seo/schema";
import { format } from "date-fns";

export const metadata = {
  title: "Blog",
  description:
    "Used-car buying guides, ownership tips, finance advice and model comparisons from the Cars365 team.",
};

export const revalidate = 3600;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { articles, totalPages } = await getPublishedArticles(page);

  const schema = buildCollectionPageSchema({
    name: "Cars365 Blog",
    description: metadata.description as string,
    url: "/blog",
  });

  return (
    <div className="min-h-screen bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas([schema]) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-foreground sm:text-5xl mb-4">
            Cars365 Blog
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Buying guides, ownership tips and model comparisons to help you buy your next used car with confidence.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            New articles are published daily. Check back soon.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/blog/${article.slug}`} className="block aspect-[16/10] relative bg-muted overflow-hidden">
                  {article.featured_image_url ? (
                    <Image
                      src={article.featured_image_url}
                      alt={article.featured_image_alt ?? article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  {article.category && (
                    <span className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
                      {article.category.name}
                    </span>
                  )}
                  <Link href={`/blog/${article.slug}`}>
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={article.published_at}>
                      {format(new Date(article.published_at), "d MMM yyyy")}
                    </time>
                    <span>·</span>
                    <span>{article.reading_time_minutes} min read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Blog pagination">
            {page > 1 ? (
              <Link
                href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-full border border-border px-5 py-2 text-sm text-slate-300">
                Previous
              </span>
            )}
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog?page=${page + 1}`}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-full border border-border px-5 py-2 text-sm text-slate-300">
                Next
              </span>
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
