import Link from "next/link";
import { format } from "date-fns";
import { requireAdminRole } from "@/lib/security/auth";
import {
  getAdminBlogArticles,
  getAdminBlogArticleById,
  getBlogCategories,
} from "@/lib/blog/queries";
import { GenerateBlogButton } from "./generate-blog-button";
import { BlogSetupChecklist } from "./blog-setup-checklist";
import { BlogEditForm } from "./blog-edit-form";

export const metadata = { title: "Blog | Admin" };

interface AdminBlogPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  await requireAdminRole(["owner", "admin"]);
  const { edit } = await searchParams;
  const articles = await getAdminBlogArticles();

  if (edit) {
    const [article, categories] = await Promise.all([
      getAdminBlogArticleById(edit),
      getBlogCategories(),
    ]);

    if (article) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section className="flex flex-col gap-3 border-b border-border pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Edit Article
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Auto-posting keeps running on its own schedule. Edits made here
              apply to this article only.
            </p>
            <p className="text-xs text-muted-foreground">
              Source: <span className="font-medium capitalize">{article.source.replace("_", " ")}</span>
              {article.published_at && (
                <>
                  {" "}· Published{" "}
                  {format(new Date(article.published_at), "d MMM yyyy HH:mm")}
                </>
              )}
            </p>
          </section>
          <BlogEditForm article={article} categories={categories} cancelHref="/admin/blog" />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col gap-3 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          SEO Blog Bot
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Automated daily articles are published via the cron job at 06:00 UTC.
          Use the button below to trigger generation manually for testing.
        </p>
      </section>

      <BlogSetupChecklist />

      <GenerateBlogButton />

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Title</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Source</th>
              <th className="text-left px-4 py-3 font-semibold">Published</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No articles yet. Generate the first one above.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{article.title}</td>
                  <td className="px-4 py-3 capitalize">{article.status}</td>
                  <td className="px-4 py-3">{article.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {article.published_at
                      ? format(new Date(article.published_at), "d MMM yyyy HH:mm")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blog?edit=${article.id}`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      {article.status === "published" ? (
                        <Link
                          href={`/blog/${article.slug}`}
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          View
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
