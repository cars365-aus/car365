# SEO Strategy & Documentation

Cars365 relies on programmatic SEO (PSEO) to drive organic marketplace liquidity. Pages are generated automatically from live inventory — when vendors add vehicles, branches (cities), or categories, the platform creates indexable landing pages with metadata, JSON-LD, and internal links.

## URL Taxonomy

| URL pattern | Purpose | Indexable? |
|-------------|---------|------------|
| `/cars/[slug]` | Vehicle detail (long-tail) | Yes, when approved |
| `/locations` | City directory (inventory-driven) | Yes |
| `/locations/[city]` | City hub | Yes when ≥5 vehicles (`noindex` below threshold) |
| `/locations/[city]/[segment]` | City+category OR city+brand (disambiguated by slug) | Category: yes when ≥3 vehicles; Brand: yes when ≥3 vehicles |
| `/categories/[category]` | National category hub | Yes when ≥10 vehicles nationally |
| `/vendors/[slug]` | Vendor authority page | Yes when approved |
| `/search` | Filter UI | **No** (`robots: noindex, follow`) |

Category slugs: `sedan`, `suv`, `people-mover`, `van`, `ute`, `luxury`.

City slugs: normalized from branch city names (e.g. `Gold Coast` → `gold-coast`).

## Auto-generation triggers

PSEO pages refresh via ISR (`revalidate = 3600`) and explicit invalidation when inventory changes:

- Vehicle create/update/delete (vendor form, bulk upload, API, admin moderation)
- Branch create (new city appears on `/locations`)
- Admin listing approval (vehicle first becomes indexable)

Invalidation helper: `src/lib/seo/invalidate.ts` → `invalidatePseo()` / `invalidatePseoForVehicle()`.

## Shared SEO library

All PSEO logic lives in `src/lib/seo/`:

- `slugs.ts` — city/category slug normalization
- `categories.ts` — canonical category enum + segment disambiguation
- `templates.ts` — title/description generators
- `schema.ts` — JSON-LD builders (BreadcrumbList, ItemList, FAQPage, Product, CollectionPage)
- `discovery.ts` — inventory queries for sitemap and location index
- `guards.ts` — thin-page `noindex` thresholds
- `invalidate.ts` — ISR path revalidation

## Metadata strategy

Every public PSEO page uses Next.js `generateMetadata` with:

- Transactional titles: `[Entity] – Used Cars in [City] | Cars365`
- Canonical URLs via `alternates.canonical`
- OpenGraph title + description (vehicle pages include first approved image when available)
- Dynamic `robots` for thin pages

## Sitemap strategy

`src/app/sitemap.ts` builds a chunked XML sitemap:

- Chunk 0: static pages, `/locations/*`, `/categories/*`, city+category combos, vendors
- All chunks: approved vehicle `/cars/[slug]` URLs (1,000 per chunk)
- Only indexable URLs (pass thin-page guards) are emitted for PSEO hubs

Root URL: `https://www.hirecar.com.au/sitemap.xml`

## Structured data (JSON-LD)

Injected via `<script type="application/ld+json">`:

- **Product + Offer** — vehicle detail pages
- **BreadcrumbList** — vehicles, cities, categories, city+category
- **ItemList** — hub pages listing vehicle URLs
- **FAQPage** — dynamic avg-price and hiring FAQs
- **CollectionPage** — national category hubs

All schema URLs use `https://www.hirecar.com.au`.

## Robots.txt

Protected paths (`/admin`, `/vendor/*`, `/customer`, `/api`, `/auth`) are blocked via `src/app/robots.ts` to preserve crawl budget for listings.

## Internal linking

- City pages link to `/locations/{city}/{category}` (not `/search`)
- Category pages link to top cities and other categories
- Vehicle breadcrumbs: Home → Locations → City → Category → Vehicle
- Site header: categories → `/categories/*`, cities → `/locations/*`

## Caching (ISR)

PSEO pages use `export const revalidate = 3600` for fast CDN delivery with hourly refresh.
