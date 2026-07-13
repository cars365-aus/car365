import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, API, auth, and conversion pages are never indexable.
        disallow: ["/admin/", "/api/", "/auth/", "/thank-you"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
