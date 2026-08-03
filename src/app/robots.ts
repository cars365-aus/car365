import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo/site";

/**
 * robots.ts — Crawler access policy
 *
 * Strategy:
 *  • Good-faith SEO bots (Googlebot, Bingbot, etc.) get full access — SEO
 *    must not be impacted.
 *  • Known bad-actor scrapers (AI training, aggressive SEO tools) are
 *    explicitly blocked. This is belt-and-suspenders alongside the
 *    edge proxy UA blocklist.
 *  • Generic unknown bots get a Crawl-delay to throttle polite crawlers.
 *  • Admin, API, and auth paths are never crawlable by anyone.
 *  • `/geo-blocked` (the out-of-region landing page) is never crawlable — it is
 *    an internal rewrite target, not a real page. Crawlers themselves are
 *    exempt from the geo gate (see src/lib/security/geo-restriction.ts), so
 *    they always receive the real page for the URL they requested.
 *
 * Note: bad bots that ignore robots.txt are handled at the edge proxy layer
 * (hard 403). This file targets bots that DO respect the standard.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();

  return {
    rules: [
      // ── Google: full access, no delay ────────────────────────────────────
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/thank-you", "/geo-blocked"],
      },
      // ── Bing: full access, no delay ──────────────────────────────────────
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/thank-you", "/geo-blocked"],
      },
      // ── Other good-faith SEO/social bots ────────────────────────────────
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/geo-blocked"],
      },
      {
        userAgent: "Slurp", // Yahoo
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/geo-blocked"],
      },
      {
        userAgent: "facebookexternalhit",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/geo-blocked"],
      },
      {
        userAgent: "Twitterbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/geo-blocked"],
      },
      {
        userAgent: "LinkedInBot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/geo-blocked"],
      },

      // ── AI training scrapers — fully blocked ─────────────────────────────
      // These crawlers are blocked because they harvest data for model
      // training without consent and do not respect site ToS.
      { userAgent: "GPTBot",             disallow: "/" },
      { userAgent: "CCBot",              disallow: "/" },
      { userAgent: "anthropic-ai",       disallow: "/" },
      { userAgent: "ClaudeBot",          disallow: "/" },
      { userAgent: "Google-Extended",    disallow: "/" }, // Gemini training
      { userAgent: "Meta-ExternalAgent", disallow: "/" }, // Meta AI training
      { userAgent: "Bytespider",         disallow: "/" }, // TikTok/ByteDance
      { userAgent: "OmgiliBot",          disallow: "/" },
      { userAgent: "Omgili",             disallow: "/" },
      { userAgent: "PetalBot",           disallow: "/" }, // Huawei mass crawler
      { userAgent: "cohere-ai",          disallow: "/" },

      // ── Aggressive SEO / OSINT tools — fully blocked ─────────────────────
      // These index the entire site at high frequency, consuming significant
      // bandwidth and server resources without providing SEO benefit.
      { userAgent: "AhrefsBot",      disallow: "/" },
      { userAgent: "SemrushBot",     disallow: "/" },
      { userAgent: "DotBot",         disallow: "/" },
      { userAgent: "MJ12bot",        disallow: "/" },
      { userAgent: "BLEXBot",        disallow: "/" },
      { userAgent: "DataForSeoBot",  disallow: "/" },
      { userAgent: "serpstatbot",    disallow: "/" },
      { userAgent: "SeobilityBot",   disallow: "/" },
      { userAgent: "Rogerbot",       disallow: "/" },
      { userAgent: "spbot",          disallow: "/" },
      { userAgent: "SiteImproveBot", disallow: "/" },

      // ── Generic / unknown bots — polite throttle ─────────────────────────
      // Allow public pages but enforce a crawl delay and block all
      // non-public paths. Crawl-delay is supported by most bots that obey
      // robots.txt but is ignored by browsers/humans, so SEO is unaffected.
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/thank-you",
          "/geo-blocked",
          "/_next/",
          "/static/",
        ],
        crawlDelay: 10, // seconds between requests for unknown crawlers
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
