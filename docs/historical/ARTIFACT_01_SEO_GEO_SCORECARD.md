# Phase 1: SEO & GEO Scorecard Framework

## A. Technical SEO
**Score: 9/10 (Excellent / production-grade)**
- **Why this score**: The platform correctly implements SSR/ISR, dynamic sitemaps, robust canonicals, and clean `robots.txt` directives.
- **Evidence**: `sitemap.ts` chunks outputs and maps `updated_at`. Explicit `alternates.canonical` definitions exist in `layout.tsx` and dynamic hubs.
- **Biggest weakness**: Faceted search (`/search`) relies heavily on query parameters and is blocked/ignored by crawlers, losing out on deep categorical discovery unless explicitly routed.
- **Fastest improvement**: Expand the programmatic SEO path router to support more dimensions than just City + Brand.
- **Impact if fixed**: Massive increase in long-tail indexation for specific vehicle categories.

## B. Marketplace SEO
**Score: 8/10 (Strong but needs improvement)**
- **Why this score**: Listing pages are well-structured with structured data, but lack extensive internal linking mechanisms (e.g., "Similar Vehicles" widgets).
- **Evidence**: `Product` and `Offer` schema are injected in `/cars/[slug]`.
- **Biggest weakness**: Lack of robust "Similar listings" or "More cars in [City]" components on the vehicle detail page to pass PageRank horizontally.
- **Fastest improvement**: Add a "Related Vehicles" grid at the bottom of `/cars/[slug]`.
- **Impact if fixed**: Better crawl depth and higher user session duration.

## C. Local/GEO SEO
**Score: 8/10 (Strong but needs improvement)**
- **Why this score**: Strong programmatic hubs exist for `/locations/[city]` and `/locations/[city]/[brand]`.
- **Evidence**: Dynamic `ItemList` schema and "Market Insight" content blocks exist on city pages. 
- **Biggest weakness**: Lack of depth. It supports City and Brand, but misses Budget (`/cars-under-[budget]/[city]`) and Body Type (`/used-suvs-in-[city]`).
- **Fastest improvement**: Scaffold Budget + City programmatic routes.
- **Impact if fixed**: Captures high-intent deal-hunting traffic.

## D. Content SEO
**Score: 2/10 (Broken or missing)**
- **Why this score**: There is absolutely zero editorial content, buying guides, or top-of-funnel informational content.
- **Evidence**: Codebase lacks a `/blog`, `/guides`, or CMS integration.
- **Biggest weakness**: Zero ability to rank for informational queries like "best family cars 2026".
- **Fastest improvement**: Deploy an MDX-based `/guides` subdirectory for editorial content.
- **Impact if fixed**: Builds domain authority, earns backlinks naturally, and captures early-stage buyers.

## E. Generative Engine Optimization / AI Search
**Score: 9/10 (Excellent / production-grade)**
- **Why this score**: Explicit optimizations have been made specifically for LLMs.
- **Evidence**: `llms.txt` deployed to root. Semantic HTML `<table>` injected into vehicle pages. `FAQPage` schema automatically populated on city and brand hubs.
- **Biggest weakness**: Trust signals and vendor profile pages lack detailed AI-readable schemas (`AutoDealer` schema).
- **Fastest improvement**: Inject `LocalBusiness` / `AutoDealer` JSON-LD onto vendor profiles.
- **Impact if fixed**: Higher visibility in "Who are the best used car dealers near me?" queries.

## F. Performance and UX SEO
**Score: 8/10 (Strong but needs improvement)**
- **Why this score**: Next.js App Router and Tailwind provide a fast baseline, but images loaded from Supabase storage may lack advanced AVIF optimization.
- **Evidence**: `<Image>` tags use `priority` for heroes, ensuring solid LCP.
- **Biggest weakness**: CDN image formatting relies on default Next.js server optimization which can be slow on cold hits.
- **Fastest improvement**: Enforce strict AVIF image formatting in `next.config.ts`.
- **Impact if fixed**: Perfect Core Web Vitals across mobile networks.

## G. Measurement and Monitoring
**Score: 3/10 (Weak, risky, incomplete)**
- **Why this score**: No evidence of Google Search Console verification or Google Analytics/PostHog tracking in the layout.
- **Evidence**: `layout.tsx` contains no tracking scripts or `<meta name="google-site-verification">` tags.
- **Biggest weakness**: Flying blind. No data on index coverage, CTR, or organic conversion paths.
- **Fastest improvement**: Inject GTM/GA4 and verify Google Search Console via DNS.
- **Impact if fixed**: Visibility into actual SEO performance.
