# ARTIFACT 02: Top 10 Highest Impact SEO & GEO Fixes

| Rank | Fix | Why it matters | Affected files/routes | Impact | Effort | Risk | Do before launch? | Validation method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Correct PSEO Metadata (Remove "Used Car")** | Targeting "used cars" on a rental platform will cause 100% bounce rates and penalize the entire domain. | `src/app/(public)/locations/[city]/[brand]/page.tsx` | High | Small | Low | **Yes** | Manual SERP preview check. |
| **2** | **Implement `AutoRental` Schema** | Vendors must be classified correctly to trigger Google Maps Local Packs for queries like "car rental near me". | `src/app/(public)/vendors/[slug]/page.tsx` | High | Medium | Low | **Yes** | Google Rich Results Test. |
| **3** | **Internal Link Grid (Similar Vehicles)** | Reduces orphan pages and distributes PageRank across the deepest layer of the site. | `src/app/(public)/cars/[slug]/page.tsx` | High | Medium | Low | **Yes** | Crawl topology map (Screaming Frog). |
| **4** | **Google Search Console & GA4 Setup** | Cannot measure organic growth, clicks, or index coverage without tracking. | `src/app/layout.tsx` | High | Small | Low | **Yes** | Verify via DNS TXT record. |
| **5** | **Slug 301 Redirect Handling** | If a vendor renames a vehicle, the slug changes. Currently throws a 404, breaking backlinks and losing PageRank. | `src/app/(public)/cars/[slug]/page.tsx` | Medium | Large | Medium | No | Curl headers to verify 301. |
| **6** | **Search Parameter Noindex** | Infinite filter parameters (`?make=X&seats=Y`) cause severe index bloat and dilute crawl budget. | `src/app/search/page.tsx` | High | Small | Low | **Yes** | Check `<meta name="robots">`. |
| **7** | **Scaffold `/car-hire/[city]/[vehicleType]`** | High volume transactional intent for specific needs (e.g., "SUV rental Brisbane"). | `/locations/[city]/[category]/page.tsx` | High | Medium | Low | No | GSC Impressions. |
| **8** | **AVIF Image Enforcement** | Supabase/Next.js currently serves standard formats. AVIF radically improves LCP on mobile. | `next.config.ts` | Medium | Small | Low | No | PageSpeed Insights / Lighthouse. |
| **9** | **Content Engine (Guides)** | Essential for acquiring Top-of-Funnel traffic ("How to rent a car in Sydney"). | `/guides/page.tsx` | High | Large | Low | No | Organic traffic growth in GA4. |
| **10** | **Update `llms.txt` Definitions** | Must explicitly define pricing rules (daily rate vs purchase price) so AI bots don't hallucinate. | `public/llms.txt` | Medium | Small | Low | **Yes** | Manual review. |
