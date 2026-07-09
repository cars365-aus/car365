# Phase 5: Content & Keyword Architecture

## A. Transactional Pages (Bottom of Funnel)

### 1. The Local Brand/Model Hub
- **URL**: `/used-cars/[city]/[brand]` or `/used-cars/[city]/[brand]/[model]`
- **Target Intent**: Transactional. User knows exactly what car they want and where they want to buy it.
- **Primary Keyword**: "Used [Brand] [Model] in [City]"
- **Secondary Keywords**: "Second hand [Brand] [Model] [City]", "[Brand] [Model] price [City]"
- **Schema**: `ItemList`, `FAQPage`
- **Conversion CTA**: "Check Availability", "Request Test Drive"

### 2. The Budget Hub
- **URL**: `/cars-under-[budget]/[city]`
- **Target Intent**: Transactional / Deal Hunting.
- **Primary Keyword**: "Used cars under $[Budget] in [City]"
- **Secondary Keywords**: "Cheap cars [City]", "Best cars under $[Budget]"
- **Schema**: `ItemList`
- **Conversion CTA**: "View Deal"

## B. Commercial Investigation Pages (Middle of Funnel)

These pages intercept users who are researching but haven't decided on a specific vehicle yet. Currently missing from the platform.

### 1. Best-in-Class Guides
- **URL**: `/guides/best-family-suvs-under-30k`
- **Target Intent**: Commercial Investigation.
- **Primary Keyword**: "Best family SUV under 30k Australia"
- **Page Outline**: 
  1. Introduction (What makes a good family SUV)
  2. Top 5 List (Dynamically pulls 1 representative vehicle from the active DB per model)
  3. Pros/Cons for each.
- **Schema**: `Article`, `ItemList`

### 2. VS Comparison Engine
- **URL**: `/compare/[brand1]-[model1]-vs-[brand2]-[model2]`
- **Target Intent**: Commercial Investigation.
- **Primary Keyword**: "[Model 1] vs [Model 2]"
- **Page Outline**: Side-by-side feature matrix. Dynamic pricing comparison based on marketplace averages.

## C. Informational Pages (Top of Funnel)

To build domain authority, the platform needs high-quality editorial content addressing user anxieties around buying used cars.

### 1. Inspection Checklist
- **URL**: `/advice/used-car-inspection-checklist`
- **Target Intent**: Informational.
- **Primary Keyword**: "How to inspect a used car"
- **Schema**: `Article`, `HowTo`
- **Conversion CTA**: "Browse inspected vehicles by verified dealers" (Internal link to main search)

### 2. Finance / Negotiation Guide
- **URL**: `/advice/how-to-negotiate-used-car-price`
- **Target Intent**: Informational.
- **Primary Keyword**: "How to negotiate used car price at dealer"
- **Owner/Source of Data**: Editorial team (Static content)
