# Phase 5: Generative Engine Optimization (GEO) Audit

**Audit Context**: AI Search engines (Google AI Overviews, Perplexity, ChatGPT Search) rely on extracting explicit facts, comparing data, and analyzing trust markers. 

## GEO Evaluation
- **Is the brand/entity clearly explained?**: Yes, via root metadata and `llms.txt`.
- **Are vehicle facts visible in HTML?**: Yes, a visually-hidden but fully rendered `<table>` explicitly outlines Make, Model, Year, Price, Location, and Seller on `/cars/[slug]`.
- **Are listing facts structured and easy to extract?**: Yes, mapped exactly to `Product` and `Offer` JSON-LD.
- **Are there answer-ready blocks?**: Yes, explicit "Market Insights" text exists on programmatic hubs.
- **Are FAQs useful and visible?**: Yes, `FAQPage` schema is dynamically generated to answer pricing questions based on live inventory.
- **Can browser agents interact with search/listing pages?**: Yes, the UI uses standard anchor links (`<Link>`) for navigation rather than pure React state routing, allowing agents to click through.
- **Are important facts hidden behind JS or modals?**: No. Key facts are SSR/ISR rendered.
- **Is there an optional llms.txt?**: Yes, `public/llms.txt` accurately outlines the pricing model and data structure without overclaiming.

## Scorecard
- **Entity clarity score**: 9/10
- **Answer-readiness score**: 9/10
- **AI-readable facts score**: 10/10
- **Citation-worthiness score**: 7/10 (Lacks deep editorial reviews to cite)
- **Trust signal score**: 7/10 (Needs `AutoDealer` schema on vendors)
- **Agent accessibility score**: 9/10
- **Overall AI/GEO score**: 8.5/10

## GEO Improvements

**Issue ID**: G-01
**GEO category**: Citation-worthiness / Trust Signals
**Current weakness**: Vendor profiles (`/vendors/[slug]`) lack `AutoDealer` JSON-LD schema, meaning AI bots cannot confidently verify that the seller is a legitimate local business.
**Evidence**: `src/app/(public)/vendors/[slug]/page.tsx` lacks schema injection.
**Recommended improvement**: Inject `AutoDealer` schema using the database's branch address data.
**Expected AI-search impact**: High. AI bots heavily weigh real-world location data when recommending vendors.
**Effort**: Medium
**Priority**: P1
