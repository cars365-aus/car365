import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllPublishedArticleSlugs } from "@/lib/blog/queries";
import { getIndexableSitemapUrls } from "@/lib/seo/discovery";

const PAGE_SIZE = 5000;
const base = "https://www.hirecarmarketplace.com.au";

export async function generateSitemaps() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    const totalVehicles = count || 0;
    const vehicleChunks = Math.ceil(totalVehicles / PAGE_SIZE) || 1;

    // 0: static + PSEO
    // 1: vendors
    // 2+: vehicles
    const chunks = [{ id: 0 }, { id: 1 }];
    for (let i = 0; i < vehicleChunks; i++) {
      chunks.push({ id: 2 + i });
    }
    return chunks;
  } catch {
    return [{ id: 0 }, { id: 1 }, { id: 2 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const chunkId = typeof id === "number" ? id : 0;

  if (chunkId === 0) {
    // Use a stable date for static pages so Google doesn't think they changed on every build
    const staticDate = new Date("2025-06-01T00:00:00Z");

    const staticRoutes: MetadataRoute.Sitemap = [
      // Core pages — highest priority. `/search` is intentionally excluded: it
      // is noindexed, so listing it in the sitemap is a conflicting signal.
      { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${base}/locations`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
      { url: `${base}/vendors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${base}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },

      // Conversion pages
      { url: `${base}/for-vendors`, lastModified: staticDate, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/for-vendors/api`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/pricing`, lastModified: staticDate, changeFrequency: "weekly", priority: 0.75 },

      // Trust / content pages
      { url: `${base}/about`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/how-it-works`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.65 },
      { url: `${base}/faq`, lastModified: staticDate, changeFrequency: "weekly", priority: 0.6 },
      { url: `${base}/contact`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/success-stories`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/press`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.4 },
      { url: `${base}/careers`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.4 },

      // Blog index
      { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },

      // Legal
      { url: `${base}/legal/privacy`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/legal/terms`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/legal/rules`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.3 },
    ];

    let blogRoutes: MetadataRoute.Sitemap = [];
    try {
      const articles = await getAllPublishedArticleSlugs();
      blogRoutes = articles.map((a) => ({
        url: `${base}/blog/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch {
      // graceful fallback
    }

    let pseoRoutes: MetadataRoute.Sitemap = [];
    try {
      const { cityUrls, categoryUrls, cityCategoryUrls } = await getIndexableSitemapUrls();
      const now = new Date();
      
      const cityMapped = cityUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
      const categoryMapped = categoryUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));
      const cityCategoryMapped = cityCategoryUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));

      // Limit PSEO to 45,000 URLs to stay safely under Google's 50k limit
      pseoRoutes = [...cityMapped, ...categoryMapped, ...cityCategoryMapped].slice(0, 45000);
    } catch {
      // graceful fallback
    }

    return [...staticRoutes, ...blogRoutes, ...pseoRoutes];
  }

  if (chunkId === 1) {
    try {
      const supabase = createAdminClient();
      const { data: vendors } = await supabase
        .from("organizations")
        .select("slug, updated_at")
        .eq("status", "approved")
        .limit(45000);

      if (vendors) {
        return vendors.map((v) => ({
          url: `${base}/vendors/${v.slug}`,
          lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }
    } catch {
      // graceful fallback
    }
    return [];
  }

  // chunkId >= 2 are Vehicles
  try {
    const supabase = createAdminClient();
    const vehicleChunkIndex = chunkId - 2;
    const start = vehicleChunkIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("slug, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .range(start, end);

    if (vehicles) {
      return vehicles.map((v) => ({
        url: `${base}/cars/${v.slug}`,
        lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // graceful fallback
  }

  return [];
}
