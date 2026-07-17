/* eslint-disable @typescript-eslint/no-explicit-any --
   Untyped Supabase client: joined rows surface as `any` at this DB boundary. */
import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteBaseUrl } from "@/lib/seo/site";
import { NAV_BODY_TYPES, BUDGET_BANDS, bodyTypeHref, budgetHref } from "@/lib/nav";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const supabase = createAdminClient();
  const staticDate = new Date("2026-01-01T00:00:00Z");

  const [makesRes, modelsRes, vehiclesRes] = await Promise.all([
    supabase.from("makes").select("slug"),
    supabase.from("models").select("slug, makes:make_id ( slug )"),
    supabase.from("vehicles").select("slug, updated_at, makes:make_id ( slug ), models:model_id ( slug )").in("status", ["available", "reserved", "sold"]).limit(45000),
  ]);

  const url = (path: string, lastModified: Date | string = staticDate, priority = 0.6): MetadataRoute.Sitemap[number] =>
    ({ url: `${base}${path}`, lastModified, changeFrequency: "weekly", priority });

  const staticRoutes = [
    "/", "/used-cars", "/sell-your-car", "/trade-in", "/finance", "/about",
    "/testimonials", "/faqs", "/contact", "/how-it-works",
    "/careers", "/press", "/legal/privacy-policy", "/legal/terms",
  ].map((p) => url(p, staticDate, p === "/" ? 1 : 0.7));

  // Programmatic landing pages.
  const makeRoutes = ((makesRes.data ?? []) as any[]).map((m) => url(`/used-cars/${m.slug}`, staticDate, 0.6));
  const modelRoutes = ((modelsRes.data ?? []) as any[])
    .filter((m) => m.makes?.slug)
    .map((m) => url(`/used-cars/${m.makes.slug}/${m.slug}`, staticDate, 0.5));
  const bodyRoutes = NAV_BODY_TYPES.map((b) => url(bodyTypeHref(b), staticDate, 0.6));
  const budgetRoutes = BUDGET_BANDS.map((b) => url(budgetHref(b.max), staticDate, 0.5));

  // VDPs.
  const vehicleRoutes = ((vehiclesRes.data ?? []) as any[])
    .filter((v) => v.makes?.slug && v.models?.slug)
    .map((v) => url(
      `/used-cars/${v.makes.slug}/${v.models.slug}/${v.slug}`,
      v.updated_at ? new Date(v.updated_at) : staticDate,
      0.8,
    ));

  return [...staticRoutes, ...makeRoutes, ...modelRoutes, ...bodyRoutes, ...budgetRoutes, ...vehicleRoutes];
}
