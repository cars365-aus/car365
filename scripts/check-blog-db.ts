import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function run() {
  const { data: cats, error: catErr } = await supabase.from("blog_categories").select("*");
  console.log("blog_categories:", cats?.length ?? 0, catErr?.message ?? "ok");

  const { count, error: artErr } = await supabase
    .from("blog_articles")
    .select("id", { count: "exact", head: true });
  console.log("blog_articles count:", count, artErr?.message ?? "ok");

  const { data: buckets } = await supabase.storage.listBuckets();
  console.log(
    "buckets:",
    buckets?.map((b) => b.name),
  );

  const { data: latest } = await supabase
    .from("blog_articles")
    .select("slug, title, featured_image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  console.log("latest article:", latest);
}

run();
