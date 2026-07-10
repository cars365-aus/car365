/* eslint-disable @typescript-eslint/no-explicit-any --
   Untyped Supabase client: joined rows surface as `any` and are shaped into
   typed domain projections before leaving this module. */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEnv } from "@/lib/config";
import { buildMediaUrl } from "@/lib/media";
import type {
  BlogCategory,
  BlogPost,
  BlogPostSummary,
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

const BLOG_SUMMARY_SELECT = `
  id, title, slug, excerpt, published_at, reading_minutes,
  blog_categories:category_id ( name, slug ),
  profiles:author_id ( full_name ),
  media_assets:cover_media_id ( storage_key )
`;

function toSummary(p: RawRow, supabaseUrl: string): BlogPostSummary {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    coverImageUrl: p.media_assets?.storage_key ? buildMediaUrl(supabaseUrl, p.media_assets.storage_key) : null,
    categoryName: p.blog_categories?.name ?? null,
    categorySlug: p.blog_categories?.slug ?? null,
    authorName: p.profiles?.full_name ?? null,
    publishedAt: p.published_at ?? null,
    readingMinutes: p.reading_minutes ?? null,
  };
}

export const getPublishedBlogPosts = unstable_cache(
  async (categorySlug?: string, limit = 24): Promise<BlogPostSummary[]> => {
    const supabase = createAdminClient();
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL").trim();
    let q = supabase
      .from("blog_posts")
      .select(BLOG_SUMMARY_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (categorySlug) q = q.eq("blog_categories.slug", categorySlug);
    const { data } = await q;
    return ((data ?? []) as RawRow[]).map((p) => toSummary(p, supabaseUrl));
  },
  ["blog-posts"],
  { revalidate: 1800, tags: ["blog", "public"] },
);

export const getBlogPostBySlug = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    const supabase = createAdminClient();
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL").trim();
    const { data: p } = await supabase
      .from("blog_posts")
      .select(`${BLOG_SUMMARY_SELECT}, body, seo_title, seo_description`)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!p) return null;
    const row = p as RawRow;
    return {
      ...toSummary(row, supabaseUrl),
      body: row.body ?? "",
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
    };
  },
  ["blog-post"],
  { revalidate: 1800, tags: ["blog", "public"] },
);

export const getBlogCategories = unstable_cache(
  async (): Promise<BlogCategory[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("blog_categories").select("id, name, slug").order("name");
    return ((data ?? []) as RawRow[]).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  },
  ["blog-categories"],
  { revalidate: 3600, tags: ["blog", "public"] },
);
