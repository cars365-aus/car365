"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { BlogArticleStatus } from "@/lib/domain";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
  body: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImageUrl: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"] as const),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export async function saveBlogArticleAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id") as string | null,
      title: formData.get("title"),
      slug: formData.get("slug"),
      body: formData.get("body"),
      excerpt: formData.get("excerpt"),
      featuredImageUrl: formData.get("featuredImageUrl"),
      featuredImageAlt: formData.get("featuredImageAlt"),
      status: formData.get("status") || "draft",
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
    };

    const parsed = articleSchema.parse(rawData);
    const supabase = createAdminClient();

    const payload = {
      title: parsed.title,
      slug: parsed.slug,
      body: parsed.body,
      excerpt: parsed.excerpt || null,
      featured_image_url: parsed.featuredImageUrl || null,
      featured_image_alt: parsed.featuredImageAlt || null,
      status: parsed.status,
      meta_title: parsed.metaTitle || null,
      meta_description: parsed.metaDescription || null,
      reading_time_minutes: Math.ceil(parsed.body.split(/\s+/).length / 200), // simple reading time estimation
      updated_at: new Date().toISOString(),
      ...(parsed.status === "published" ? { published_at: new Date().toISOString() } : {}),
    };

    if (parsed.id) {
      const { error } = await supabase
        .from("blog_articles")
        .update(payload)
        .eq("id", parsed.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("blog_articles")
        .insert(payload);
      
      if (error) throw error;
    }

    const revalidate = revalidateTag as (tag: string) => void;
    revalidate("blog");
    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save article" };
  }
}

export async function deleteBlogArticleAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) throw error;
    
    const revalidate = revalidateTag as (tag: string) => void;
    revalidate("blog");
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete article" };
  }
}
