import { revalidatePath } from "next/cache";
import { generateBlogArticle } from "@/lib/ai/blog-generator";
import { resolveBlogFeaturedImage } from "@/lib/ai/blog-image";
import { runBlogPreflight } from "@/lib/blog/preflight";
import { pickNextTopic } from "@/lib/blog/topic-queue";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize-html";
import { computeReadingTimeMinutes, startOfUtcDay } from "@/lib/blog/utils";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PublishDailyResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  slug?: string;
  articleId?: string;
  error?: string;
  warnings?: string[];
}

async function getRecentTopicKeys(days: number): Promise<string[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await supabase
    .from("blog_articles")
    .select("topic_key")
    .eq("source", "auto_bot")
    .gte("created_at", since)
    .not("topic_key", "is", null);

  return (data ?? [])
    .map((row) => row.topic_key as string)
    .filter(Boolean);
}

async function getCategoryId(slug: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return data?.id ?? null;
}

function uniqueSlugSuffix(base: string): string {
  const suffix = Date.now().toString(36).slice(-5);
  const trimmed = base.slice(0, 170);
  return `${trimmed}-${suffix}`;
}

export async function publishDailyBlog(options?: {
  force?: boolean;
}): Promise<PublishDailyResult> {
  const preflight = await runBlogPreflight();
  if (!preflight.ready) {
    const failed = preflight.checks.filter((c) => !c.ok && c.id !== "unsplash");
    return {
      ok: false,
      error: `Blog not ready: ${failed.map((c) => c.label).join(", ")}. Apply DB migration and set env vars.`,
    };
  }

  const warnings: string[] = [];
  if (!preflight.checks.find((c) => c.id === "unsplash")?.ok) {
    warnings.push("UNSPLASH_ACCESS_KEY not set — articles may publish without images if Imagen fails");
  }
  if (!preflight.checks.find((c) => c.id === "storage")?.ok) {
    warnings.push("blog-images bucket missing — featured images cannot be uploaded");
  }

  const supabase = createAdminClient();
  const todayStart = startOfUtcDay();

  if (!options?.force) {
    const { data: existingToday } = await supabase
      .from("blog_articles")
      .select("id, slug")
      .eq("source", "auto_bot")
      .eq("status", "published")
      .gte("published_at", todayStart)
      .limit(1)
      .maybeSingle();

    if (existingToday) {
      try {
        revalidatePath("/blog");
        revalidatePath(`/blog/${existingToday.slug}`);
        revalidatePath("/sitemap.xml");
      } catch {
        // revalidatePath only works inside Next.js request context
      }
      return {
        ok: true,
        skipped: true,
        reason: "Article already published today",
        slug: existingToday.slug,
        articleId: existingToday.id,
      };
    }
  }

  const recentKeys = await getRecentTopicKeys(30);
  const topic = pickNextTopic(recentKeys);

  let article;
  try {
    article = await generateBlogArticle(topic);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Article generation failed",
    };
  }

  const bodyHtml = sanitizeBlogHtml(article.bodyHtml);
  if (!bodyHtml || bodyHtml.length < 200) {
    return { ok: false, error: "Generated article body failed sanitization or was too short" };
  }

  const image = await resolveBlogFeaturedImage({
    slug: article.slug,
    imagePrompt: article.featuredImagePrompt,
    alt: article.featuredImageAlt,
    searchQuery: `${article.primaryKeyword} Australia car`,
  });

  if (!image) {
    warnings.push("No featured image generated — article published without hero image");
  }

  const categoryId = await getCategoryId(article.categorySlug);
  const now = new Date().toISOString();
  const readingTime = computeReadingTimeMinutes(bodyHtml);

  let slug = article.slug;
  let inserted: { id: string; slug: string } | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      slug = uniqueSlugSuffix(article.slug);
    }

    const { data, error: insertError } = await supabase
      .from("blog_articles")
      .insert({
        title: article.title,
        slug,
        body: bodyHtml,
        excerpt: article.excerpt,
        featured_image_url: image?.url ?? null,
        featured_image_alt: image?.alt ?? article.featuredImageAlt,
        category_id: categoryId,
        status: "published",
        meta_title: article.metaTitle,
        meta_description: article.metaDescription,
        reading_time_minutes: readingTime,
        published_at: now,
        updated_at: now,
        source: "auto_bot",
        topic_key: topic.key,
        primary_keyword: article.primaryKeyword,
        tags: article.tags,
      })
      .select("id, slug")
      .single();

    if (!insertError && data) {
      inserted = data;
      break;
    }

    lastError = insertError?.message ?? "Insert failed";

    // Duplicate daily post or slug conflict — treat daily duplicate as skip
    if (insertError?.code === "23505") {
      if (!options?.force) {
        const { data: dupToday } = await supabase
          .from("blog_articles")
          .select("id, slug")
          .eq("source", "auto_bot")
          .eq("status", "published")
          .gte("published_at", todayStart)
          .limit(1)
          .maybeSingle();

        if (dupToday) {
          return {
            ok: true,
            skipped: true,
            reason: "Article already published today (concurrent run)",
            slug: dupToday.slug,
            articleId: dupToday.id,
          };
        }
      }
      continue;
    }

    return { ok: false, error: lastError };
  }

  if (!inserted) {
    return { ok: false, error: lastError ?? "Failed to insert article after retries" };
  }

  try {
    revalidatePath("/blog");
    revalidatePath(`/blog/${inserted.slug}`);
    revalidatePath("/sitemap.xml");
  } catch {
    // revalidatePath only works inside Next.js request context; ignore in scripts
  }

  return {
    ok: true,
    slug: inserted.slug,
    articleId: inserted.id,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
