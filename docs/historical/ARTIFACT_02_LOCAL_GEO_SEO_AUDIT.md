# Phase 2: Local & GEO SEO Audit

## Location & Hierarchy Analysis
Currently, the application has a basic `/locations/[city]` hub. This is insufficient for capturing long-tail hyper-local intent.

**Gaps Identified:**
- No combination routes exist (e.g., Brand + City, Model + City).
- No dealer/vendor profile pages exist on public routes (`/vendors/[slug]` exists but lacks localized schema).
- No specific "Used cars under [budget] in [city]" routes exist.

## Proposed Local Page Templates

### 1. `/used-cars/[city]` (Replaces `/locations/[city]`)
**Purpose**: Primary geographical hub.
**Features**:
- Aggregated real inventory count for the city.
- Dynamic average price metric for that city.
- "Popular Brands in [City]" quick links.
- "Cars under $10k/20k/30k in [City]" quick links.
- Local `FAQPage` schema answering ("What is the average cost of a used car in [City]?").

### 2. `/used-cars/[city]/[brand]`
**Purpose**: High-intent brand + location capture.
**Features**:
- Filters auto-applied for Make = `brand` and Location = `city`.
- Brand-specific buying guide tailored to the climate/terrain of the city (e.g., 4x4s in Perth vs Hatchbacks in Sydney).
- Internal links to specific models (`/used-cars/[city]/[brand]/[model]`).
- Breadcrumbs: Home > Used Cars > [City] > [Brand].

### 3. `/used-cars/[city]/[brand]/[model]`
**Purpose**: Bottom-of-funnel conversion hub.
**Features**:
- Strict inventory display for exact make/model.
- If inventory < 3, auto-append "Similar [Body Type] cars in [City]" to prevent thin-content penalties.
- Price distribution graph/text (e.g., "Toyota Hilux models in Sydney range from $25,000 to $65,000").

### 4. `/cars-under/[budget]/[city]`
**Purpose**: Budget-conscious capture.
**Features**:
- Dynamic inventory filtered by `maxPrice`.
- Cross-links to alternative budget brackets.

### 5. `/dealers/[city]`
**Purpose**: Vendor discovery.
**Features**:
- `AutoDealer` JSON-LD schema for approved vendors.
- Aggregated reviews/trust scores.

## Trust & "Near Me" Signals
- Ensure physical branch addresses are injected into the HTML as `<address>` tags to trigger Google Local signals.
- Inject `LocalBusiness` schema for Vendor profile pages linked from the city hubs.
