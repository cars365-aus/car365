import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-success/15 text-success",
  scheduled: "bg-warning/15 text-warning",
  draft: "bg-muted text-muted-foreground",
};

export default async function AdminBlogPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, blog_categories:category_id ( name )")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Blog</h1>
        <p className="text-sm text-muted-foreground">Published posts appear at /blog. A rich editor + AI drafting is on the roadmap.</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Published</th></tr>
          </thead>
          <tbody>
            {(posts ?? []).length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No posts yet.</td></tr>
            ) : (posts ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-foreground">{p.title}</td>
                <td className="p-3 text-body">{(p.blog_categories as unknown as { name: string })?.name ?? "—"}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[p.status] ?? ""}`}>{p.status}</span></td>
                <td className="p-3 text-muted-foreground">{p.published_at ? format(new Date(p.published_at), "d MMM yyyy") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
