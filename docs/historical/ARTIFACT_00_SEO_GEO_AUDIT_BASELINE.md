# Phase 0: SEO/GEO Audit Baseline

## 1. Detected Framework & Rendering Strategy
- **Framework**: Next.js 16.2.6 (App Router)
- **Rendering Strategy**: 
  - Heavily relies on **Incremental Static Regeneration (ISR)** for programmatic pages (e.g., `export const revalidate = 3600;` on location hubs).
  - Uses Server-Side Rendering (SSR) for dynamic search routes (`/search`).
  - Static Site Generation (SSG) for static marketing/legal pages.

## 2. Route Map & Public Page Map
- **Listing Detail**: `/cars/[slug]` (ISR)
- **Search/Filter**: `/search` (SSR)
- **City Landing Pages**: `/locations/[city]` (ISR)
- **Brand + City Pages**: `/locations/[city]/[brand]` (ISR)
- **Static Pages**: `/` (Home), `/pricing`, `/about`, `/contact`, `/faq`
- **Vendor/Dealer Pages**: `/vendors/[slug]` (Dynamic)

## 3. SEO Implementation Baseline

### Sitemap Implementation
- **Status**: Implemented via `src/app/sitemap.ts`.
- **Details**: Dynamically generates chunks of 1,000 URLs, covering static routes, location pages, and vehicle URLs. Maps `updated_at` to `<lastmod>` for crawl efficiency.

### robots.txt Implementation
- **Status**: Implemented via `src/app/robots.ts`.
- **Details**: Correctly blocks private routes (`/customer`, `/vendor`, `/admin`, `/api`) while allowing Googlebot to crawl public directories.

### Metadata Implementation
- **Status**: Strong.
- **Details**: Uses `generateMetadata` heavily. Root `layout.tsx` contains standardized OpenGraph and Twitter card schemas. Dynamic pages inject title/description based on database attributes.

### Canonical Implementation
- **Status**: Strong.
- **Details**: Explicit `alternates: { canonical: "..." }` declarations are present across the root layout and dynamic hubs, neutralizing parameter-based duplicate content risks.

### Structured Data Implementation
- **Status**: Excellent.
- **Details**: 
  - `Product`, `Offer`, and `FAQPage` schemas are injected into `/cars/[slug]`.
  - `BreadcrumbList`, `ItemList`, and `FAQPage` schemas are injected into programmatic hub pages (`/locations/[city]`, `/locations/[city]/[brand]`).

### Image Optimization
- **Status**: Strong.
- **Details**: Utilizes `next/image` with `priority` flags for LCP images (hero shots).

### Internal Linking
- **Status**: Usable but average.
- **Details**: Strong breadcrumb linking (Home > Locations > City > Brand) exists, but cross-linking between sibling locations/brands could be improved.

### Blog/Content System
- **Status**: Missing.
- **Details**: No editorial content structure exists for Top-of-Funnel (ToFu) queries (e.g., "how to rent a car in Sydney").

### AI Discovery / Generative Engine Optimization
- **Status**: Cutting-edge.
- **Details**: Contains an explicit `llms.txt` discovery file. Vehicle detail pages render visually-hidden semantic HTML `<table>` elements specifically formatted for AI extraction, alongside `FAQPage` schema.

### Current SEO Risks Spotted Immediately
- Lack of a Top-of-Funnel editorial blog restricts non-commercial organic traffic.
- Heavy reliance on JavaScript for search filtering (`/search`) means crawlers cannot index faceted variants outside of the explicitly mapped PSEO hubs (`/locations/[city]/[brand]`).
