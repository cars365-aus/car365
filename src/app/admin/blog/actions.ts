"use server";

import { revalidatePath } from "next/cache";
import { publishDailyBlog } from "@/lib/blog/publish-daily";
import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogArticleUpdateSchema } from "@/lib/validation/schemas";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize-html";
import { computeReadingTimeMinutes } from "@/lib/blog/utils";

export type GenerateBlogState = {
  status: "idle" | "success" | "error";
  message: string;
  slug?: string;
  warnings?: string[];
};

export async function triggerDailyBlogGeneration(
  _prev: GenerateBlogState,
  formData: FormData,
): Promise<GenerateBlogState> {
  await requireAdminRole(["owner", "admin"]);

  const intent = formData.get("intent");
  const force = intent === "force";

  try {
    const result = await publishDailyBlog({ force });

    if (!result.ok) {
      return { status: "error", message: result.error ?? "Generation failed" };
    }

    if (result.skipped) {
      return {
        status: "success",
        message: result.reason ?? "Skipped — already published today",
        slug: result.slug,
      };
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    const warningText = result.warnings?.length
      ? ` Warnings: ${result.warnings.join("; ")}`
      : "";

    return {
      status: "success",
      message: `Published: ${result.slug}${warningText}`,
      slug: result.slug,
      warnings: result.warnings,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type UpdateBlogArticleState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Admin edit for an existing blog article — auto-posted articles keep
 * publishing on their own schedule, but once live an admin can correct or
 * rewrite the content here (title, body, SEO fields, status, etc).
 */
export async function updateBlogArticle(
  articleId: string,
  _prevState: UpdateBlogArticleState,
  formData: FormData,
): Promise<UpdateBlogArticleState> {
  const admin = await requireAdminRole(["owner", "admin"]);

  const rawTags = (formData.get("tags") as string) ?? "";
  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    status: formData.get("status"),
    categoryId: (formData.get("categoryId") as string) || null,
    featuredImageUrl: (formData.get("featuredImageUrl") as string) || null,
    featuredImageAlt: (formData.get("featuredImageAlt") as string) || null,
    metaTitle: (formData.get("metaTitle") as string) || null,
    metaDescription: (formData.get("metaDescription") as string) || null,
    tags: rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };

  const result = blogArticleUpdateSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed. Please fix the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = result.data;
  const sanitizedBody = sanitizeBlogHtml(data.body);
  if (sanitizedBody.length < 1) {
    return {
      success: false,
      error: "Article body cannot be empty after sanitization.",
    };
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("blog_articles")
    .select("slug, status, published_at")
    .eq("id", articleId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: "Article not found." };
  }

  const now = new Date().toISOString();
  const isNewlyPublished = data.status === "published" && existing.status !== "published";

  const { error: updateError } = await supabase
    .from("blog_articles")
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: sanitizedBody,
      status: data.status,
      category_id: data.categoryId || null,
      featured_image_url: data.featuredImageUrl || null,
      featured_image_alt: data.featuredImageAlt || null,
      meta_title: data.metaTitle || null,
      meta_description: data.metaDescription || null,
      reading_time_minutes: computeReadingTimeMinutes(sanitizedBody),
      tags: data.tags,
      published_at: isNewlyPublished ? now : existing.published_at,
      updated_at: now,
    })
    .eq("id", articleId);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        success: false,
        error: "That slug is already used by another article. Choose a different one.",
        fieldErrors: { slug: ["This slug is already in use"] },
      };
    }
    return {
      success: false,
      error: `Failed to save article: ${updateError.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: admin.id,
    action: "blog_article_updated",
    resource_type: "blog_article",
    resource_id: articleId,
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  if (data.slug !== existing.slug) {
    revalidatePath(`/blog/${data.slug}`);
  }
  revalidatePath("/sitemap.xml");

  return { success: true };
}
