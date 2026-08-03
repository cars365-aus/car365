import { optionalEnv } from "@/lib/config";

/** Canonical site origin (no trailing slash) for SEO URLs. */
export function siteBaseUrl(): string {
  const raw = optionalEnv("NEXT_PUBLIC_APP_URL") || "https://www.cars-365.com.au";
  return raw.replace(/\/$/, "");
}

/** Absolute URL for a site-relative path — used by JSON-LD and OG tags. */
export function absoluteUrl(path: string): string {
  return `${siteBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Self-referencing canonical for a page.
 *
 * Next.js does NOT emit a canonical unless a route declares one, and any
 * `alternates.canonical` set in a layout is inherited by every descendant. The
 * root layout used to declare `canonical: "/"`, which meant *every* URL on the
 * site — listings, landing pages, every VDP — told Google "the homepage is the
 * real version of me". That collapses the entire site into a single indexable
 * URL. Every route now declares its own path through this helper instead.
 *
 * Pass only the clean path: query strings must never appear in a canonical, so
 * filter/sort permutations collapse onto the hub page they belong to.
 */
export function canonical(path: string): { canonical: string } {
  return { canonical: absoluteUrl(path) };
}
