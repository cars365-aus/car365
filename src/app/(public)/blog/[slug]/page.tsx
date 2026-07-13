import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getPublishedArticleBySlug,
  getRelatedArticles,
} from "@/lib/blog/queries";
import { getAppUrl } from "@/lib/config";
import {
  buildArticleSchema,
  buildBlogBreadcrumbSchema,
  serializeSchemas,
} from "@/lib/seo/schema";
import { format } from "date-fns";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found" };

  const baseUrl = getAppUrl();
  const title = (article.meta_title ?? `${article.title} | Hire Car Blog`).slice(0, 60);
  const description = (article.meta_description ?? article.excerpt).slice(0, 155);
  const url = `${baseUrl}/blog/${article.slug}`;
  const image = article.featured_image_url ?? `${baseUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      images: [{ url: image, alt: article.featured_image_alt ?? article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(
    article.category?.slug ?? null,
    article.id,
  );

  const baseUrl = getAppUrl();

  const schemas = [
    buildArticleSchema({
      title: article.title,
      description: article.meta_description ?? article.excerpt,
      slug: article.slug,
      imageUrl: article.featured_image_url,
      datePublished: article.published_at,
      dateModified: article.updated_at,
      baseUrl,
    }),
    buildBlogBreadcrumbSchema({
      slug: article.slug,
      title: article.title,
      categoryName: article.category?.name,
      categorySlug: article.category?.slug,
      baseUrl,
    }),
  ];

  return (
    <div className="min-h-screen bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(schemas) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          {article.category && (
            <>
              <span className="mx-2">/</span>
              <span className="text-muted-foreground">{article.category.name}</span>
            </>
          )}
        </nav>

        <header className="mb-8">
          {article.category && (
            <span className="inline-block text-xs font-bold uppercase tracking-wide text-primary mb-3">
              {article.category.name}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={article.published_at}>
              {format(new Date(article.published_at), "d MMMM yyyy")}
            </time>
            <span>·</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
        </header>

        {article.featured_image_url && (
          <figure className="mb-10 -mx-4 sm:mx-0">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
              <Image
                src={article.featured_image_url}
                alt={article.featured_image_alt ?? article.title}
                fill
                className="object-cover"
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </figure>
        )}

        <article
          className="blog-content text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-6 text-center">
          <p className="font-semibold text-foreground mb-3">Ready to find your rental car?</p>
          <Link
            href="/search"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            Browse available cars
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="text-xl font-bold text-foreground mb-6">Related articles</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-3">
                    {post.featured_image_url ? (
                      <Image
                        src={post.featured_image_url}
                        alt={post.featured_image_alt ?? post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="200px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
