import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE = "https://www.hirecarmarketplace.com.au";
const PAGE_SIZE = 5000;

/**
 * `sitemap.ts` uses `generateSitemaps()`, which Next serves at
 * `/sitemap/[id].xml` with no `/sitemap.xml` index. So instead of advertising a
 * single (404-ing) `/sitemap.xml`, we list every existing chunk directly —
 * Google supports multiple `Sitemap:` directives. Chunks:
 *   0 → static + pSEO + blog,  1 → vendors,  2+ → vehicle chunks.
 */
async function sitemapUrls(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    const vehicleChunks = Math.ceil((count || 0) / PAGE_SIZE) || 1;
    const total = 2 + vehicleChunks; // ids 0..(1 + vehicleChunks)
    return Array.from({ length: total }, (_, id) => `${BASE}/sitemap/${id}.xml`);
  } catch {
    // Fallback matches sitemap.ts's own fallback of chunks [0, 1, 2].
    return [`${BASE}/sitemap/0.xml`, `${BASE}/sitemap/1.xml`, `${BASE}/sitemap/2.xml`];
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/vendor/dashboard",
          "/vendor/leads",
          "/vendor/onboarding",
          "/vendor/upgrade",
          "/auth/",
          "/api/",
          "/messages/",
          "/customer/",
        ],
      },
    ],
    sitemap: await sitemapUrls(),
  };
}
