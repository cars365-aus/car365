# Phase 1: Technical SEO Audit

## A. Crawlability

**Issue ID:** T-001
**Category:** Crawlability
**Severity:** High
**Affected route/files:** `/search`, `src/components/search-widget.tsx`
**Evidence:** The primary `/search` page heavily utilizes query parameters (e.g., `?make=Toyota&city=Sydney`).
**SEO impact:** Googlebot struggles to crawl infinite permutations of query parameters, leading to index bloat and diluted PageRank.
**User impact:** Users cannot easily share clean URLs for specific categories.
**Recommended fix:** Transition core attributes (Brand, City) to path-based static routes (e.g., `/used-cars/sydney/toyota`) while keeping minor filters (price, color) as query parameters.
**Implementation complexity:** High
**Verification method:** Inspect `robots.txt` and generated sitemaps.
**Priority:** 1

## B. Indexability

**Issue ID:** T-002
**Category:** Indexability
**Severity:** Medium
**Affected route/files:** `src/app/(public)/cars/[slug]/page.tsx`, `src/app/(public)/locations/[city]/page.tsx`
**Evidence:** The Next.js `generateMetadata` function does not currently enforce strict canonical URLs in the `alternates` metadata object.
**SEO impact:** Potential duplicate content penalties if URLs are appended with tracking parameters (e.g., `?utm_source=...`).
**User impact:** None.
**Recommended fix:** Inject `alternates: { canonical: "https://www.hirecar.com.au/cars/" + slug }` inside all `generateMetadata` functions.
**Implementation complexity:** Low
**Verification method:** Check `<link rel="canonical">` tag in rendered HTML.
**Priority:** 2

## C. Metadata

**Issue ID:** T-003
**Category:** Metadata
**Severity:** Medium
**Affected route/files:** `src/app/layout.tsx`
**Evidence:** Fallback metadata is generic and does not leverage advanced Open Graph and Twitter card attributes optimally for a marketplace.
**SEO impact:** Lower click-through rates (CTR) from social shares.
**User impact:** Less engaging link previews.
**Recommended fix:** Update root layout metadata to include default OG images, Twitter card formats, and explicit locale mappings.
**Implementation complexity:** Low
**Verification method:** Use Facebook Sharing Debugger.
**Priority:** 3

## D. Structured Data

**Issue ID:** T-004
**Category:** Structured Data
**Severity:** High
**Affected route/files:** `src/app/(public)/cars/[slug]/page.tsx`, `src/app/(public)/locations/[city]/page.tsx`
**Evidence:** JSON-LD is injected, but `/locations/[city]` is missing `ItemList` schema for the displayed inventory. Additionally, no `FAQPage` schema exists on pages with FAQs.
**SEO impact:** Google misses rich snippet opportunities for localized inventory and direct FAQ answers.
**User impact:** Reduced visibility in search SERPs.
**Recommended fix:** Add `ItemList` schema to city/brand hub pages. Add `FAQPage` schema dynamically to pages rendering Q&A components.
**Implementation complexity:** Medium
**Verification method:** Google Rich Results Test.
**Priority:** 1

## E. Sitemaps

**Issue ID:** T-005
**Category:** Sitemaps
**Severity:** Low
**Affected route/files:** `src/app/sitemap.ts`
**Evidence:** The sitemap chunks entities, but does not explicitly track `<lastmod>` based on `updated_at` timestamps from the database.
**SEO impact:** Slower recrawl rates for recently updated vehicle listings.
**User impact:** Outdated prices/availability shown in Google Search.
**Recommended fix:** Map the `lastmod` field in `sitemap.ts` to the database `updated_at` field.
**Implementation complexity:** Low
**Verification method:** Inspect `sitemap.xml` output.
**Priority:** 2

## F. Performance SEO

**Issue ID:** T-006
**Category:** Performance
**Severity:** Low
**Affected route/files:** `src/app/(public)/cars/[slug]/page.tsx`
**Evidence:** Hero images use `priority`, but the image CDN (Supabase Storage) lacks aggressive automated format optimization (e.g., forcing WebP/AVIF output via parameters).
**SEO impact:** Potential LCP degradation on mobile connections.
**User impact:** Slower visual loading for high-res hero shots.
**Recommended fix:** Ensure Next.js `next.config.ts` is fully configured for `remotePatterns` and `imageSizes` to enforce WebP/AVIF delivery.
**Implementation complexity:** Low
**Verification method:** PageSpeed Insights.
**Priority:** 3
