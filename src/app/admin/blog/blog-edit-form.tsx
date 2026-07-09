"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateBlogArticle, type UpdateBlogArticleState } from "./actions";
import type { AdminBlogArticleDetail } from "@/lib/blog/queries";

const initialState: UpdateBlogArticleState = { success: false };

interface BlogEditFormProps {
  article: AdminBlogArticleDetail;
  categories: { id: string; name: string; slug: string }[];
  cancelHref: string;
}

export function BlogEditForm({ article, categories, cancelHref }: BlogEditFormProps) {
  const updateWithId = updateBlogArticle.bind(null, article.id);
  const [state, formAction, pending] = useActionState(updateWithId, initialState);
  const prevSuccessRef = useRef(false);

  useEffect(() => {
    if (state.success && !prevSuccessRef.current) {
      toast.success("Article saved.");
    }
    prevSuccessRef.current = state.success;
  }, [state.success]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Edit Article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={article.title} className="mt-1" />
            <FieldError errors={state.fieldErrors} field="title" />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={article.slug} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              Changing the slug moves the article to a new URL — old links will 404.
            </p>
            <FieldError errors={state.fieldErrors} field="slug" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={article.status}
                className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <FieldError errors={state.fieldErrors} field="status" />
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={article.category_id ?? ""}
                className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">— None —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} field="categoryId" />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={article.excerpt}
              className="mt-1"
            />
            <FieldError errors={state.fieldErrors} field="excerpt" />
          </div>

          <div>
            <Label htmlFor="body">Body (HTML)</Label>
            <Textarea
              id="body"
              name="body"
              rows={18}
              defaultValue={article.body}
              className="mt-1 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Allowed tags: h2, h3, p, ul, ol, li, blockquote, a (relative links
              only), strong, em, br. Anything else is stripped on save.
            </p>
            <FieldError errors={state.fieldErrors} field="body" />
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>SEO &amp; Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="featuredImageUrl">Featured Image URL</Label>
              <Input
                id="featuredImageUrl"
                name="featuredImageUrl"
                defaultValue={article.featured_image_url ?? ""}
                className="mt-1"
              />
              <FieldError errors={state.fieldErrors} field="featuredImageUrl" />
            </div>
            <div>
              <Label htmlFor="featuredImageAlt">Featured Image Alt Text</Label>
              <Input
                id="featuredImageAlt"
                name="featuredImageAlt"
                defaultValue={article.featured_image_alt ?? ""}
                className="mt-1"
              />
              <FieldError errors={state.fieldErrors} field="featuredImageAlt" />
            </div>
          </div>

          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={article.meta_title ?? ""}
              className="mt-1"
            />
            <FieldError errors={state.fieldErrors} field="metaTitle" />
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              defaultValue={article.meta_description ?? ""}
              className="mt-1"
            />
            <FieldError errors={state.fieldErrors} field="metaDescription" />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={article.tags.join(", ")}
              className="mt-1"
            />
            <FieldError errors={state.fieldErrors} field="tags" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <a
          href={cancelHref}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Saving…" : "Save Article"}
        </button>
      </div>
    </form>
  );
}

function FieldError({
  errors,
  field,
}: {
  errors?: Record<string, string[]>;
  field: string;
}) {
  const fieldErrors = errors?.[field];
  if (!fieldErrors?.length) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400" aria-live="polite">
      {fieldErrors.join(", ")}
    </p>
  );
}
