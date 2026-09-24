import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo/site";

/**
 * robots.ts — Crawler access policy
 *
 * Strategy:
 *  • Baseline policy: Allow all crawlers to access the public website.
 *  • Real security (authentication, authorization, WAF) is used to protect
 *    admin, API, internal tools, and AI endpoints.
 *  • robots.txt is strictly for public crawler preference, NEVER security.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
