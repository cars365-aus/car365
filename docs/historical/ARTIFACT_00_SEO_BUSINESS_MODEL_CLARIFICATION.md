# ARTIFACT 00: SEO Business Model Clarification

## 1. True Business Model: Car Hire / Vehicle Rental
The application is strictly a **Car Hire / Rental Marketplace**, not a used car sales platform. 

## 2. Codebase Evidence
- **Pricing Model**: Database uses `price_per_day_aud`, not total sale price.
- **Rental Mechanics**: Database fields include `daily_distance_limit_km` and `extra_distance_fee_aud`, which only exist in rentals.
- **Metadata**: Next.js `generateMetadata` dynamically outputs `"Hire a {year} {make} {model} for ${price}/day"`.
- **Title Tags**: Use `"Car Hire in {city} | Hire Car"`.
- **Domain**: `hirecar.com.au`

## 3. SEO Keyword Mismatch Risks
The previous audit incorrectly recommended targeting terms like "used Toyota in Sydney", "cheap used cars under 10k", and "used car buying checklist". 

**Risk**: If we target "used cars", our bounce rate will be near 100% because users looking to *buy* a car will land on a page offering *daily rentals*. This destroys engagement metrics, causing Google to permanently tank the domain's authority for all queries (Pogo-sticking penalty).

## 4. Correct Targeting Strategy
**Target Keywords (Car Hire Intent):**
- `car hire in [city]`
- `[brand] car hire [city]` (e.g., Toyota car hire Sydney)
- `rent a [bodyType] in [city]` (e.g., rent a SUV in Melbourne)
- `long term car rental [city]`
- `airport car hire [city]`

**Avoid Keywords (Sales Intent):**
- `used cars [city]`
- `cars for sale`
- `cars under [budget]`
- `second hand cars`

## 5. Schema & Page Template Corrections
- **Schema**: While `Product` and `Offer` schema are technically valid for rentals, `AutoRental` (a subset of `LocalBusiness`) is the most powerful schema for vendor pages. The `Offer` schema must explicitly state `priceSpecification` as `PriceType: RentalRate`.
- **Page Templates**: The previous programmatic hub recommendation for `/used-cars/[city]` was catastrophic. We must transition or strictly enforce the URL pattern to `/car-hire/[city]` or `/locations/[city]`. Our recent implementation kept it at `/locations/[city]`, which is safe, but the copy on the brand hub (`/locations/[city]/[brand]`) must strictly use "Car Hire" and not "Used [Brand]".
