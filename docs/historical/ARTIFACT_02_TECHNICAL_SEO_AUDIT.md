# Phase 2: Technical SEO Audit

**Audit Context**: The codebase leverages Next.js 16 (App Router) with Incremental Static Regeneration (ISR) and Server-Side Rendering (SSR). Recent updates have enforced strict canonicals and programmatic rendering protections.

## Findings

**Issue ID**: T-01
**Category**: Redirects/Status Codes
**Severity**: Medium
**Score impact**: -1
**Affected route**: `src/app/(public)/cars/[slug]/page.tsx`
**Affected files**: `src/app/(public)/cars/[slug]/page.tsx`
**Evidence**: If a vehicle `slug` changes (e.g., vendor renames a listing), the old URL throws a hard 404 via `notFound()`.
**Why it matters**: 404s on previously indexed listing pages leak PageRank.
**Recommended fix**: Implement a `redirects` table in Supabase. Check the `redirects` table before calling `notFound()` in the vehicle detail page, emitting a 301 Permanent Redirect to the new slug if found.
**Expected SEO lift**: Preserves link equity from external shares.
**Effort**: Medium
**Priority**: P1

**Issue ID**: T-02
**Category**: URL Structure / Parameter Bloat
**Severity**: Low
**Score impact**: 0
**Affected route**: `src/app/search/page.tsx`
**Affected files**: `src/app/search/page.tsx`
**Evidence**: The search page functions exclusively via URL parameters (`?make=Toyota&city=Sydney`).
**Why it matters**: Search parameter permutations cause index bloat.
**Recommended fix**: The current `robots.txt` or `metadata` should explicitly enforce `noindex, follow` on `/search?*` routes to ensure Google relies solely on our canonical PSEO hubs (`/locations/[city]/[brand]`) rather than crawling infinite filter permutations.
**Expected SEO lift**: Optimizes crawl budget.
**Effort**: Small
**Priority**: P2

**Issue ID**: T-03
**Category**: Internal Linking / Crawl Depth
**Severity**: Medium
**Score impact**: -1
**Affected route**: `src/app/(public)/cars/[slug]/page.tsx`
**Affected files**: `src/app/(public)/cars/[slug]/page.tsx`
**Evidence**: The listing page has a Breadcrumb, but zero cross-links to "Other vehicles by this vendor" or "Other [Make] vehicles in [City]".
**Why it matters**: Deep or older listings become "orphan pages" if they drop off the main category pages.
**Recommended fix**: Inject a Server Component at the bottom of the page that runs a fast query for 4 similar vehicles based on `category` and `city`.
**Expected SEO lift**: Flattens site architecture and increases crawl efficiency.
**Effort**: Medium
**Priority**: P1

## Verification Summary
- **Can Google crawl key pages?** Yes. SSR/ISR is fully functional.
- **Is core content rendered in HTML?** Yes.
- **Are titles/descriptions unique?** Yes. Handled beautifully by `generateMetadata`.
- **Are canonicals correct?** Yes. Strictly enforced.
- **Are private pages blocked?** Yes. Handled by `robots.ts`.
- **Is structured data valid?** Yes. Product, Offer, FAQPage, BreadcrumbList, ItemList present.
