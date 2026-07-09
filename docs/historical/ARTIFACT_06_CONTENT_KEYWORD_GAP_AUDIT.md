# Phase 6: Content & Keyword Gap Audit

**Audit Context**: The application is highly optimized for Transactional intent (Bottom of Funnel) but completely lacks Commercial Investigation (Middle of Funnel) and Informational (Top of Funnel) content.

## A. Transactional SEO Gaps (Bottom of Funnel)
*These map directly to our Programmatic SEO (PSEO) architecture.*

1. **Idea**: `cars under [budget] in [city]`
   - **Intent**: Transactional
   - **Why it matters**: Captures price-conscious buyers who care less about brand and more about utility.
   - **Implementation**: Needs a new parameterized route `/cars-under-[budget]/[city]` with `ItemList` schema.

2. **Idea**: `used [body-type] cars in [city]`
   - **Intent**: Transactional
   - **Why it matters**: Captures lifestyle buyers (e.g., "used SUVs in Sydney", "used Utes in Perth").
   - **Implementation**: Needs a new route `/used-[bodyType]-in-[city]`.

## B. Commercial Investigation Gaps (Middle of Funnel)
*These require editorial or dynamically generated "Comparison" landing pages.*

1. **Idea**: `best used family SUVs under 30k`
   - **Intent**: Commercial Investigation
   - **Why it matters**: Captures buyers who are ready to purchase but need validation on *what* to buy.
   - **Implementation**: Create a `/guides/best-family-suvs-under-30k` MDX article that dynamically injects active vehicle cards.

2. **Idea**: `Toyota RAV4 vs Mazda CX-5 used`
   - **Intent**: Commercial Investigation
   - **Why it matters**: High volume search from buyers deciding between two highly popular models.
   - **Implementation**: Create a `/compare/[model1]-vs-[model2]` dynamic route that evaluates average prices, specs, and local availability.

## C. Informational Gaps (Top of Funnel)
*These require a standard CMS/Blog architecture to build domain authority.*

1. **Idea**: `used car buying checklist australia`
   - **Intent**: Informational
   - **Why it matters**: Establishes the brand as a trusted authority. Generates high-quality backlinks.
   - **Implementation**: Publish a comprehensive, downloadable checklist in a `/blog/` route. Include `HowTo` schema.
   - **Conversion CTA**: "Browse inspected vehicles by verified dealers".

2. **Idea**: `what is a good mileage for a used car`
   - **Intent**: Informational
   - **Why it matters**: Answers a very common, highly-searched AI Overview prompt.
   - **Implementation**: Dedicated blog post with clear headers, bullet points, and an embedded widget showing low-mileage vehicles available locally.
