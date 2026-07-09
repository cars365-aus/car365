import { optionalEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BlogPreflightResult {
  ready: boolean;
  checks: {
    id: string;
    label: string;
    ok: boolean;
    detail: string;
  }[];
}

export async function runBlogPreflight(): Promise<BlogPreflightResult> {
  const checks: BlogPreflightResult["checks"] = [];

  const geminiKey = optionalEnv("GEMINI_API_KEY");
  checks.push({
    id: "gemini",
    label: "GEMINI_API_KEY",
    ok: !!geminiKey,
    detail: geminiKey ? "Configured" : "Missing — article generation will fail",
  });

  const cronSecret = optionalEnv("CRON_SECRET");
  checks.push({
    id: "cron",
    label: "CRON_SECRET",
    ok: !!cronSecret && cronSecret.length >= 16 && !/\s/.test(cronSecret),
    detail: cronSecret
      ? cronSecret.length >= 16 && !/\s/.test(cronSecret)
        ? "Configured"
        : "Must be 16+ chars with no spaces/newlines"
      : "Missing — Vercel cron cannot authenticate",
  });

  const unsplash = optionalEnv("UNSPLASH_ACCESS_KEY");
  checks.push({
    id: "unsplash",
    label: "UNSPLASH_ACCESS_KEY",
    ok: !!unsplash,
    detail: unsplash
      ? "Configured (image fallback)"
      : "Optional — recommended if Imagen fails",
  });

  let dbOk = false;
  let categoryCount = 0;
  let bucketOk = false;

  try {
    const supabase = createAdminClient();

    const { error: tableError } = await supabase
      .from("blog_articles")
      .select("id", { count: "exact", head: true });

    dbOk = !tableError;
    checks.push({
      id: "db",
      label: "Database tables",
      ok: dbOk,
      detail: tableError
        ? `blog_articles missing — run migration 20260618100000_blog_articles.sql (${tableError.message})`
        : "blog_articles table exists",
    });

    if (dbOk) {
      const { count } = await supabase
        .from("blog_categories")
        .select("id", { count: "exact", head: true });
      categoryCount = count ?? 0;
      checks.push({
        id: "categories",
        label: "Blog categories",
        ok: categoryCount > 0,
        detail:
          categoryCount > 0
            ? `${categoryCount} categories seeded`
            : "No categories — re-run migration seed",
      });
    }

    const { data: buckets } = await supabase.storage.listBuckets();
    bucketOk = buckets?.some((b) => b.name === "blog-images") ?? false;
    checks.push({
      id: "storage",
      label: "blog-images bucket",
      ok: bucketOk,
      detail: bucketOk
        ? "Storage bucket exists"
        : "Missing — featured image uploads will fail",
    });
  } catch (err) {
    checks.push({
      id: "db",
      label: "Database tables",
      ok: false,
      detail: err instanceof Error ? err.message : "Database unreachable",
    });
  }

  const requiredOk = checks
    .filter((c) => c.id !== "unsplash")
    .every((c) => c.ok || (c.id === "storage" && dbOk)); // storage nice-to-have for publish without image

  // Required: gemini, cron (for auto), db, categories
  const ready =
    !!geminiKey &&
    dbOk &&
    categoryCount > 0 &&
    (!!cronSecret || true); // cron only needed for automated runs, not manual admin trigger

  return {
    ready: !!geminiKey && dbOk && categoryCount > 0,
    checks,
  };
}
