"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBlogArticleAction, deleteBlogArticleAction } from "@/app/admin/blog/actions";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { BlogArticle } from "@/lib/domain";

interface BlogFormProps {
  initialData?: BlogArticle | null;
}

export function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [content, setContent] = useState(initialData?.body || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set("body", content); // Append rich text

    const result = await saveBlogArticleAction(null, formData);

    if (result.success) {
      toast.success("Blog article saved successfully!");
      router.push("/admin/blog");
    } else {
      toast.error(result.error || "Failed to save article");
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this article?")) return;
    
    setIsPending(true);
    const result = await deleteBlogArticleAction(initialData.id);
    
    if (result.success) {
      toast.success("Article deleted!");
      router.push("/admin/blog");
    } else {
      toast.error(result.error || "Failed to delete");
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Article" : "New Article"}</h1>
          <p className="text-sm text-muted-foreground">Craft an incredible story.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-card p-6 shadow-sm">
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <input 
              name="title" 
              defaultValue={initialData?.title} 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input 
              name="slug" 
              defaultValue={initialData?.slug} 
              required 
              pattern="^[a-z0-9-]+$"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select 
              name="status" 
              defaultValue={initialData?.status || "draft"} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Excerpt (Optional)</label>
          <textarea 
            name="excerpt" 
            defaultValue={initialData?.excerpt || ""} 
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">Featured Image URL</label>
            <input 
              name="featuredImageUrl" 
              defaultValue={initialData?.featuredImageUrl || ""} 
              placeholder="https://..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image Alt Text</label>
            <input 
              name="featuredImageAlt" 
              defaultValue={initialData?.featuredImageAlt || ""} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">SEO Title</label>
            <input 
              name="metaTitle" 
              defaultValue={initialData?.metaTitle || ""} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SEO Description</label>
            <input 
              name="metaDescription" 
              defaultValue={initialData?.metaDescription || ""} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          {initialData ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm font-semibold text-danger hover:underline disabled:opacity-50"
            >
              Delete Article
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save Article
          </button>
        </div>
      </form>
    </div>
  );
}
