/* eslint-disable @typescript-eslint/no-explicit-any --
   Untyped Supabase client: joined rows surface as `any` and are shaped into
   typed domain projections before leaving this module. */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEnv } from "@/lib/config";
import { buildMediaUrl } from "@/lib/media";
import type {
  Faq,
  Testimonial,
} from "@/lib/domain";

type RawRow = Record<string, any>;

export const getApprovedTestimonials = unstable_cache(
  async (limit = 12): Promise<Testimonial[]> => {
    const supabase = createAdminClient();
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL").trim();
    const { data } = await supabase
      .from("testimonials")
      .select("id, customer_name, rating, quote, source, review_date, vehicle_id, media_assets:photo_media_id ( storage_key )")
      .eq("is_approved", true)
      .order("sort_order", { ascending: true })
      .order("review_date", { ascending: false })
      .limit(limit);
    return ((data ?? []) as RawRow[]).map((t) => ({
      id: t.id,
      customerName: t.customer_name,
      photoUrl: t.media_assets?.storage_key ? buildMediaUrl(supabaseUrl, t.media_assets.storage_key) : null,
      vehicleId: t.vehicle_id ?? null,
      rating: t.rating,
      quote: t.quote,
      source: t.source,
      reviewDate: t.review_date ?? null,
    }));
  },
  ["testimonials"],
  { revalidate: 3600, tags: ["testimonials", "public"] },
);

export const getPublishedFaqs = unstable_cache(
  async (category?: string): Promise<Faq[]> => {
    const supabase = createAdminClient();
    let q = supabase
      .from("faqs")
      .select("id, category, question, answer, sort_order")
      .eq("is_published", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (category) q = q.eq("category", category);
    const { data } = await q;
    return ((data ?? []) as RawRow[]).map((f) => ({
      id: f.id,
      category: f.category,
      question: f.question,
      answer: f.answer,
      sortOrder: f.sort_order,
    }));
  },
  ["faqs"],
  { revalidate: 3600, tags: ["faqs", "public"] },
);

export const getPublishedBlogArticles = unstable_cache(
  async (limit = 100): Promise<any[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    return ((data ?? []) as RawRow[]).map(mapBlogArticle);
  },
  ["blog_articles"],
  { revalidate: 3600, tags: ["blog", "public"] }
);

export const getBlogArticleBySlug = unstable_cache(
  async (slug: string): Promise<any | null> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("slug", slug)
      .single();

    return data ? mapBlogArticle(data as RawRow) : null;
  },
  ["blog_article_by_slug"],
  { revalidate: 3600, tags: ["blog", "public"] }
);

function mapBlogArticle(row: RawRow): any {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    excerpt: row.excerpt,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt,
    categoryId: row.category_id,
    status: row.status,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    readingTimeMinutes: row.reading_time_minutes,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    source: row.source,
    topicKey: row.topic_key,
    primaryKeyword: row.primary_keyword,
    tags: row.tags,
  };
}
