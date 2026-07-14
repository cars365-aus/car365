# Phase 4: Generative Engine Optimization (GEO) & AI Search Plan

To rank in Google AI Overviews, SearchGPT, and Perplexity, the application must provide clear, concise, and structured facts that Large Language Models can easily extract and cite.

## A. Entity Clarity & AI-Readable Facts
Currently, vehicle details are scattered across visual components. We need to consolidate factual data so crawlers don't have to guess.

**Implementation on `/cars/[slug]`:**
- Introduce an "At a Glance" HTML table near the top of the listing. Tables are heavily favored by LLMs for structured extraction.
  ```html
  <table aria-label="Vehicle Specifications">
    <tbody>
      <tr><th>Make</th><td>Toyota</td></tr>
      <tr><th>Model</th><td>RAV4</td></tr>
      <tr><th>Year</th><td>2021</td></tr>
      <tr><th>Price</th><td>$35,000 AUD</td></tr>
      <tr><th>Location</th><td>Sydney, NSW</td></tr>
    </tbody>
  </table>
  ```

## B. Answer-Ready Content (FAQ Blocks)
AI Overviews trigger heavily on Question/Answer intent. We must anticipate these questions on programmatic pages.

**Implementation on `/used-cars/[city]`:**
- Add an accordion (visible text) with `FAQPage` JSON-LD behind it.
- **Q:** "What is the average price of a used car in [City]?"
- **A:** "Based on [Count] active listings on Cars365, the average used car price in [City] is $[Average]."
- **Q:** "Who are the top used car dealers in [City]?"
- **A:** "Top rated dealers in [City] include [Dealer 1], [Dealer 2], and [Dealer 3]."

## C. Citation-Worthy Content (The "Why")
LLMs need authoritative opinions to cite. We should inject dynamic, data-driven "insights" into the Brand/Model PSEO pages.
- **Implementation:** Add a "Market Insight" component to `/used-cars/[city]/[brand]` that calculates data on the fly: "Currently, 45% of used [Brand] vehicles in [City] are priced under $20,000."

## D. AI Discovery Files
**`/llms.txt`**:
We will generate an `llms.txt` file at the domain root. This file provides a markdown-formatted summary of the site's purpose and points AI web-crawlers (like `OAI-SearchBot`) to our primary data hubs.
- **Content:**
  ```markdown
  # Cars365 Marketplace
  Cars365 is Australia's premium vehicle marketplace connecting verified local dealers with buyers.
  
  ## Public Data Interfaces
  - Search Inventory: https://www.hirecar.com.au/search
  - Browse by City: https://www.hirecar.com.au/locations
  
  ## Trust & Safety
  All vehicles are listed by verified ABN-holding dealerships. Prices are displayed in AUD.
  ```

## E. Content Formatting Rules for Future Devs
- Avoid hiding crucial factual data (price, mileage) exclusively inside Javascript interactive states (e.g., hidden tabs) without corresponding JSON-LD.
- Always use semantic HTML5 (`<article>`, `<section>`, `time datetime=""`) to wrap listing data.
