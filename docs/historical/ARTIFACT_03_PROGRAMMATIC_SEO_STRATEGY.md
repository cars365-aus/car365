# Phase 3: Programmatic SEO Strategy

To scale from 20,000 to 1,000,000+ users, the platform requires a programmatic SEO (PSEO) engine that safely generates hub pages based on database combinations without creating spam/doorway pages.

## Page Clusters & Rules

### 1. The City Cluster (`/used-cars/[city]`)
- **Intent**: Informational/Navigational. User wants to see what's available locally.
- **Data Required**: Count of active vehicles in `city`.
- **Index/Noindex Rule**: `Index` if active vehicles > 5. `Noindex` if < 5.
- **H1 Pattern**: "Used Cars in [City] - [Total Count] Available"
- **Metadata Template**: "Find the best used cars in [City]. Browse [Total Count] verified vehicles from trusted local dealers."

### 2. The Brand + City Cluster (`/used-cars/[city]/[brand]`)
- **Intent**: Transactional. User wants a specific make locally.
- **Data Required**: Count of active `brand` vehicles in `city`.
- **Index/Noindex Rule**: `Index` if count > 3. `Noindex` if < 3.
- **H1 Pattern**: "Used [Brand] Cars in [City]"
- **Schema**: `ItemList` of the vehicles.
- **Thin-Page Prevention**: If count is exactly 1 or 2, render the vehicles but add a `noindex, follow` meta tag to prevent Google from indexing a near-empty category page, while still passing PageRank to the vehicle detail page.

### 3. The Budget + City Cluster (`/cars-under-[budget]/[city]`)
- **URL Pattern**: `/cars-under-10000/sydney`, `/cars-under-20000/melbourne`
- **Intent**: Transactional/Budget-restricted.
- **Data Required**: Vehicles where `price <= [budget]` in `city`.
- **Index/Noindex Rule**: Only index standard brackets (`10000`, `15000`, `20000`, `30000`). Disallow custom budget parameters in `robots.txt` (e.g., `Disallow: /search?maxPrice=*`).

### 4. The Body Type Cluster (`/used-[bodyType]-cars/[city]`)
- **URL Pattern**: `/used-suv-cars/brisbane`, `/used-hatchback-cars/sydney`
- **Intent**: Navigational/Exploratory.
- **Data Required**: Vehicles where `category == [bodyType]` in `city`.

## Internal Link Graph Strategy
PSEO only works if pages are crawlable. 
- **From Homepage**: Link to top 10 Cities. Link to top 10 Brands.
- **From City Page**: Link to top 5 Brands in that City. Link to Budget brackets for that City. Link to top 5 Body Types in that City.
- **From Brand Page**: Link to Model pages. Link to other Cities for that Brand (e.g., "Looking for a Toyota outside Sydney? Check Melbourne").
- **From Listing Detail Page**: Breadcrumb linking back up the chain (`Home > Used Cars > [City] > [Brand]`).

## Sitemap Inclusion Rules
The `sitemap.ts` must perform a `COUNT()` grouping query. It should ONLY emit URLs into the sitemap array if the combination meets the `Index/Noindex Rule` threshold defined above.
