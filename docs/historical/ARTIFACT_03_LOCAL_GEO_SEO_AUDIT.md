# Phase 3: Local / GEO SEO Audit

**Audit Context**: The application relies on `/locations/[city]` and `/locations/[city]/[brand]` to serve local queries. 

## Local SEO Page Types Scorecard

### 1. City Pages (`/locations/[city]`)
- **Current status**: Strong
- **Score out of 10**: 9/10
- **Search intent**: Informational / Navigational ("car hire in Sydney")
- **Evidence**: `ItemList` schema present. "Market Insights" text present. `noindex` protection for <5 listings active.
- **Problems**: Lacks an explicit `FAQPage` block for localized anomalies (e.g., "Are there toll roads in Sydney?").
- **Recommended improvements**: Inject city-specific non-commodity insights into the layout (e.g., toll info, airport distance).
- **Indexing rule**: Index if vehicles >= 5.
- **Internal links needed**: Link to Budget hubs ("Cars under $50/day").
- **Priority**: P2

### 2. Brand + City Pages (`/locations/[city]/[brand]`)
- **Current status**: Strong
- **Score out of 10**: 9/10
- **Search intent**: Transactional ("used toyota in sydney")
- **Evidence**: Dynamic H1s, Market Insights based on brand data, schema injections.
- **Problems**: None immediately visible. Highly scalable.
- **Indexing rule**: Index if vehicles >= 3.
- **Priority**: P3

### 3. Model + City Pages (`/locations/[city]/[brand]/[model]`)
- **Current status**: Missing
- **Score out of 10**: 0/10
- **Search intent**: Deep Transactional ("used toyota rav4 in sydney")
- **Evidence**: Route does not exist in `src/app/(public)/locations/`.
- **Problems**: Misses the highest-converting bottom-of-funnel traffic.
- **Recommended improvements**: Scaffold this route using the same architectural pattern as the Brand + City page.
- **Indexing rule**: Index if vehicles >= 2.
- **Priority**: P1

### 4. Budget + City Pages (`/cars-under-[budget]/[city]`)
- **Current status**: Missing
- **Score out of 10**: 0/10
- **Search intent**: Transactional / Deal Hunting ("cars under 30k in melbourne")
- **Evidence**: Route does not exist.
- **Problems**: Misses price-conscious search traffic.
- **Recommended improvements**: Scaffold a parameterized route that accepts budget ranges (e.g. `$20,000`, `$30,000`).
- **Priority**: P2

### 5. Dealer/Seller Profiles (`/vendors/[slug]`)
- **Current status**: Weak
- **Score out of 10**: 4/10
- **Search intent**: Navigational / Trust ("is [Vendor] legit")
- **Evidence**: Route exists but lacks `AutoDealer` JSON-LD schema or explicit `<address>` tags.
- **Problems**: Fails to trigger Google's local pack or maps integration.
- **Recommended improvements**: Add `AutoDealer` schema using the branch address data. Render physical addresses in semantic HTML.
- **Priority**: P1
