import { BlogForm } from "@/components/admin/blog-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { BlogArticle } from "@/lib/domain";

export const metadata = {
  title: "Edit Blog Article | Admin",
};

export default async function EditBlogArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  
  const { data } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const article: BlogArticle = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    body: data.body,
    excerpt: data.excerpt,
    featuredImageUrl: data.featured_image_url,
    featuredImageAlt: data.featured_image_alt,
    categoryId: data.category_id,
    status: data.status,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    readingTimeMinutes: data.reading_time_minutes,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    createdAt: data.created_at,
    source: data.source,
    topicKey: data.topic_key,
    primaryKeyword: data.primary_keyword,
    tags: data.tags || [],
  };

  return <BlogForm initialData={article} />;
}
