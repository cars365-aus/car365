import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 12;

function normalizeCategory(
  raw: { name: string; slug: string } | { name: string; slug: string }[] | null,
): { name: string; slug: string } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export type BlogArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  reading_time_minutes: number;
  published_at: string;
  category: { name: string; slug: string } | null;
};

export type BlogArticleDetail = BlogArticleListItem & {
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
  tags: string[];
};

export async function getPublishedArticles(page = 1): Promise<{
  articles: BlogArticleListItem[];
  total: number;
  totalPages: number;
}> {
  const supabase = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("blog_articles")
    .select(
      "id, title, slug, excerpt, featured_image_url, featured_image_alt, reading_time_minutes, published_at, blog_categories(name, slug)",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[blog] Failed to fetch articles:", error.message);
    return { articles: [], total: 0, totalPages: 0 };
  }

  const articles = (data ?? []).map((row) => {
    const cat = normalizeCategory(
      row.blog_categories as { name: string; slug: string } | { name: string; slug: string }[] | null,
    );
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      featured_image_url: row.featured_image_url,
      featured_image_alt: row.featured_image_alt,
      reading_time_minutes: row.reading_time_minutes,
      published_at: row.published_at!,
      category: cat,
    };
  });

  const total = count ?? 0;
  return {
    articles,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getPublishedArticleBySlug(
  slug: string,
): Promise<BlogArticleDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .select(
      "id, title, slug, excerpt, body, featured_image_url, featured_image_alt, reading_time_minutes, published_at, updated_at, meta_title, meta_description, tags, blog_categories(name, slug)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const cat = normalizeCategory(
    data.blog_categories as { name: string; slug: string } | { name: string; slug: string }[] | null,
  );

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    featured_image_url: data.featured_image_url,
    featured_image_alt: data.featured_image_alt,
    reading_time_minutes: data.reading_time_minutes,
    published_at: data.published_at!,
    updated_at: data.updated_at,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    tags: data.tags ?? [],
    category: cat,
  };
}

export async function getRelatedArticles(
  categorySlug: string | null,
  excludeId: string,
  limit = 3,
): Promise<BlogArticleListItem[]> {
  if (!categorySlug) return [];

  const supabase = createAdminClient();

  const { data: category } = await supabase
    .from("blog_categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return [];

  const { data } = await supabase
    .from("blog_articles")
    .select(
      "id, title, slug, excerpt, featured_image_url, featured_image_alt, reading_time_minutes, published_at, blog_categories(name, slug)",
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const cat = normalizeCategory(
      row.blog_categories as { name: string; slug: string } | { name: string; slug: string }[] | null,
    );
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      featured_image_url: row.featured_image_url,
      featured_image_alt: row.featured_image_alt,
      reading_time_minutes: row.reading_time_minutes,
      published_at: row.published_at!,
      category: cat,
    };
  });
}

export async function getAllPublishedArticleSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_articles")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []).map((row) => ({
    slug: row.slug,
    updated_at: row.updated_at,
  }));
}

export async function getAdminBlogArticles(): Promise<
  {
    id: string;
    title: string;
    slug: string;
    status: string;
    source: string;
    published_at: string | null;
    created_at: string;
  }[]
> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_articles")
    .select("id, title, slug, status, source, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export type AdminBlogArticleDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: string;
  source: string;
  category_id: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  reading_time_minutes: number;
  published_at: string | null;
  updated_at: string;
  tags: string[];
};

/** Admin-scoped single-article fetch by id, status-agnostic (drafts included). */
export async function getAdminBlogArticleById(
  id: string,
): Promise<AdminBlogArticleDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .select(
      "id, title, slug, excerpt, body, status, source, category_id, featured_image_url, featured_image_alt, meta_title, meta_description, reading_time_minutes, published_at, updated_at, tags",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return { ...data, tags: data.tags ?? [] };
}

export async function getBlogCategories(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  return data ?? [];
}

export { PAGE_SIZE as BLOG_PAGE_SIZE };
