# Phase 0: Baseline SEO & GEO Discovery

## Core Framework & Rendering Strategy
- **Framework**: Next.js 16.2.6 (App Router)
- **Rendering Strategy**: 
  - Heavily relies on Server-Side Rendering (SSR) via React Server Components.
  - SEO-critical routes (`/cars/[slug]`, `/locations/[city]`) utilize Incremental Static Regeneration (ISR) with `export const revalidate = 3600;`.
- **Hosting / CDN**: Vercel Edge caching.
- **Database**: Supabase PostgreSQL.

## Current Route Map (SEO Relevant)
- **Listing Detail**: `/cars/[slug]` (Dynamic, ISR enabled)
- **Search/Filter**: `/search` (SSR, dynamic parameters like `?city=`, `?make=`)
- **City Landing Pages**: `/locations/[city]` (ISR enabled, maps programmatic SEO hubs)
- **Static Pages**: `/` (Home), `/pricing`, `/about`, `/contact`, `/faq`
- **Vendor/Dealer Pages**: `/vendors/[slug]` (Authority pages for sellers)

## Current SEO Implementation State
- **Metadata**: Next.js `generateMetadata` is used on `/cars/[slug]` and `/locations/[city]` to inject dynamic `<title>` and `<meta name="description">` tags based on database payloads.
- **Sitemap**: `/sitemap.xml` dynamically generated via Next.js `generateSitemaps`. It is correctly chunked (1,000 URLs per file) and includes vehicles, vendors, cities, and static pages.
- **Robots.txt**: Exists via Next.js `robots.ts`. Blocks `/customer`, `/vendor`, `/admin`, and `/api`.
- **Canonical URLs**: Not explicitly defined in the metadata objects across all dynamic pages.
- **Structured Data**: JSON-LD is injected manually via `<script>` tags on `/cars/[slug]` (Product/Offer schemas) and `/locations/[city]` (BreadcrumbList schema).
- **Image Optimization**: Utilizes `next/image`. Hero images use `priority={true}` for LCP optimization.
- **Internal Linking**: Navigational links use the Next.js `<Link>` component. Footer contains category quick-links.

## Current Crawlability & Web Vitals Risks
- **Crawlability**: Faceted search parameters on `/search` are not indexable as static routes, limiting deep discovery of make/model combinations unless linked externally. 
- **AI/GEO Optimization**: The site lacks specific machine-readable summaries (`llms.txt`) and deep "Answer Engine" content blocks (e.g., FAQ accordions for specific models, or local buying guides).
- **Core Web Vitals**: LCP is stable due to `<Image priority>`. TTFB is stable due to ISR. CLS is minimized through Next.js image dimensions.
