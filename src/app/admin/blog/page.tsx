import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "date-fns";

export const metadata = {
  title: "Manage Blog | Admin",
};

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data: articles } = await supabase
    .from("blog_articles")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Articles</h1>
          <p className="text-muted-foreground">Manage your state-of-the-art blog platform.</p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="size-4" /> New Article
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium hidden sm:table-cell">Published Date</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles?.map((article) => (
              <tr key={article.id} className="transition-colors hover:bg-muted/50">
                <td className="p-4">
                  <div className="font-medium text-foreground">{article.title}</div>
                  <div className="text-xs text-muted-foreground">/{article.slug}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    article.status === 'published' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {article.status}
                  </span>
                </td>
                <td className="p-4 hidden sm:table-cell text-muted-foreground">
                  {article.published_at ? formatDate(new Date(article.published_at), "MMM d, yyyy") : "—"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/blog/${article.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted text-foreground">
                      <Edit2 className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!articles?.length && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No articles found. Create your first post!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
