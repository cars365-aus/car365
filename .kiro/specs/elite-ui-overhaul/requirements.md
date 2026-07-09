# Requirements Document

## Introduction

Full UI overhaul of the RentLeads car hire platform to achieve a premium, elite SaaS aesthetic. The redesign covers every page and shared component across the application — public pages, vendor dashboard, admin console, and auth flows — establishing a cohesive design system built on deep navy accents, premium blue primary color, white/light backgrounds, soft gradients, clean card patterns, strong typography, and mobile-first responsive layouts. All existing functionality, APIs, routes, auth flows, forms, database logic, and business logic must be preserved without regression.

## Glossary

- **Design_System**: The shared collection of CSS custom properties, Tailwind theme tokens, and reusable UI primitives (buttons, cards, inputs, badges, modals) that enforce visual consistency across RentLeads
- **Public_Pages**: Customer-facing pages including Landing/Home, Pricing, Browse Cars, Search, Vendor Profiles, Locations, Contact, and Legal pages
- **Vendor_Dashboard**: Authenticated vendor-facing pages including Dashboard, Leads, Vehicles, Branches, Analytics, Billing, Settings, and Onboarding flows
- **Admin_Console**: Platform administrator pages for managing vendors, listings, leads, billing, fraud, reviews, branches, and audit logs
- **Auth_Pages**: Sign-in, sign-up, callback, and password reset pages using Supabase Auth
- **Global_Layout**: Shared layout elements including Navbar (SiteHeader), Footer (SiteFooter), and page-level wrappers
- **Premium_Theme**: The target visual direction defined by white/light backgrounds, deep navy (#0f172a) accent text, premium blue (#2563eb) primary color, soft gradients, generous whitespace, and refined typography
- **Conversion_Element**: UI component specifically designed to drive user action — headlines, CTAs, trust badges, social proof, benefit sections, and pricing tables
- **Pricing_Table**: The vendor subscription pricing display showing Basic ($29/mo), Pro ($79/mo, Most Popular), and Premium ($179/mo) tiers with annual billing toggle (20% discount)
- **Mobile_First**: Design approach where layouts are authored for small screens first, then enhanced progressively for tablet and desktop viewports

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a unified design system with premium tokens and shared primitives, so that visual consistency is enforced across the entire platform without ad-hoc styling.

#### Acceptance Criteria

1. THE Design_System SHALL define CSS custom properties for the Premium_Theme including primary blue (#2563eb), deep navy foreground (#0f172a), white background (#ffffff), and a neutral scale derived from slate tones
2. THE Design_System SHALL provide typography tokens with a system font stack featuring Inter or equivalent sans-serif, heading weights of 700-900, body weight of 400-500, and tight letter-spacing on headings (-0.02em to -0.04em)
3. THE Design_System SHALL define spacing scale tokens (4px base unit), border-radius tokens (sm: 6px, md: 8px, lg: 12px, xl: 16px), and shadow elevation tokens with increasing blur and offset values across four levels (sm: 1px blur, md: 4px blur, lg: 10px blur, xl: 20px blur)
4. THE Design_System SHALL export reusable UI primitives including Button (primary, secondary, ghost, outline variants), Card (default, elevated, interactive variants), Badge (status colors), Input, and Section wrapper components, where each interactive component supports disabled, hover, focus, and active states
5. WHEN a dark mode toggle is activated, THE Design_System SHALL switch all CSS custom properties to a dark palette using backgrounds no lighter than #1e293b and foreground colors meeting WCAG AA contrast ratios (minimum 4.5:1 for text, 3:1 for UI elements) within a single render cycle
6. THE Design_System SHALL ensure that every exported UI primitive renders without error when all Design_System CSS custom properties are loaded, and displays a visible fallback value if a referenced token is undefined

### Requirement 2: Global Layout Overhaul

**User Story:** As a visitor, I want the site header and footer to feel professional and premium, so that I trust the platform immediately upon arrival.

#### Acceptance Criteria

1. THE Global_Layout SHALL render a sticky navigation header with a white background at 85% opacity and backdrop blur, the RentLeads wordmark, primary navigation links, and a CTA button styled with the primary blue color at minimum 44×44px touch target size
2. THE Global_Layout SHALL render a footer with deep navy background (#0f172a), organized link columns (Product, Company, Legal, Support), social media links, and copyright notice
3. WHILE the viewport width is below 768px, THE Global_Layout SHALL collapse the navigation into a mobile hamburger menu that opens a slide-in drawer with a transition duration between 200ms and 300ms
4. WHEN the mobile navigation drawer is opened, THE Global_Layout SHALL trap keyboard focus within the drawer and provide a visible close button of at least 44×44px touch target size
5. THE Global_Layout SHALL maintain consistent horizontal padding (16px mobile, 24px tablet, 32px desktop) and a maximum content width of 1280px centered on the page
6. WHEN the user scrolls past 80px, THE Global_Layout header SHALL apply a box-shadow of at least 1px vertical offset and switch to a fully opaque white background to distinguish it from page content
7. IF the user activates the mobile hamburger menu button via keyboard or tap, THEN THE Global_Layout SHALL open the drawer and move focus to the first focusable element within the drawer

### Requirement 3: Landing Page Premium Redesign

**User Story:** As a first-time visitor, I want the landing page to convey premium quality and trustworthiness, so that I am motivated to search for vehicles or sign up as a vendor.

#### Acceptance Criteria

1. THE Public_Pages landing page SHALL display a hero section with a bold headline (font-weight 800+, size 48px mobile / 72px desktop), a value proposition subtitle of no more than 120 characters, and a search widget containing at minimum a location input field and a search submit button, rendered on a light gradient or subtle pattern background
2. THE Public_Pages landing page SHALL include a trust signals bar immediately below the hero displaying verified vendor count (numeric), total vehicles available (numeric), a customer satisfaction rating displayed as a numeric star average out of 5, and up to 6 partner logos
3. THE Public_Pages landing page SHALL display a "How It Works" section with 3 numbered steps using icon cards on a clean white background
4. THE Public_Pages landing page SHALL display a featured vehicles grid showing up to 6 vehicle cards using the Design_System Card component with hover shadow elevation matching the Design_System md shadow token, and a "View All" link navigating to the search page
5. THE Public_Pages landing page SHALL display a popular locations grid with 3 to 8 location cards, each showing a city image, vehicle count, and starting price
6. THE Public_Pages landing page SHALL display a testimonials section with 2 to 6 customer quote cards, each showing the quote text (maximum 280 characters), a star rating out of 5, and reviewer name
7. THE Public_Pages landing page SHALL display a vendor/business CTA section with a deep navy background (#0f172a), benefit bullet points, and a primary action button linking to the vendor sign-up flow
8. THE Public_Pages landing page SHALL load with a Largest Contentful Paint below 2.5 seconds by using appropriately sized images, priority loading for above-fold content, and no heavy animation libraries
9. IF fewer than 1 featured vehicle is available, THEN THE Public_Pages landing page SHALL hide the featured vehicles section entirely rather than displaying an empty grid
10. THE Public_Pages landing page SHALL render sections in the following order from top to bottom: hero, trust signals bar, How It Works, featured vehicles, popular locations, testimonials, vendor CTA

### Requirement 4: Pricing Page with Exact Tier Structure

**User Story:** As a potential vendor, I want to see clear pricing tiers with feature comparisons, so that I can choose the right plan for my fleet size.

#### Acceptance Criteria

1. THE Pricing_Table SHALL display three plan cards: Basic ($29/month, up to 5 vehicle listings), Pro ($79/month, up to 20 vehicle listings with "Most Popular - Best Value" badge), and Premium ($179/month, unlimited vehicle listings)
2. THE Pricing_Table SHALL visually highlight the Pro plan as "Most Popular - Best Value" using a visible badge label and a differentiated card style (e.g., elevated border, distinct background, or scale) distinguishable from the other two plan cards
3. THE Pricing_Table SHALL include an annual/monthly billing toggle that defaults to monthly billing on initial page load, with a "Save 20% annually" label near the toggle
4. WHEN the user selects annual billing, THE Pricing_Table SHALL display annual prices reflecting a 20% discount (Basic: $278.40/year, Pro: $758.40/year, Premium: $1,718.40/year)
5. THE Pricing_Table SHALL display a "14-day free trial" badge and "No credit card required" text on each plan card
6. THE Pricing_Table Basic plan SHALL list included features (5 vehicle listings, vendor profile page, inquiry form leads, email lead notifications) and excluded features displayed with a visual distinction (WhatsApp click button, phone click tracking, analytics dashboard, featured placement, AI SEO content, GPS Verified badge, priority support)
7. THE Pricing_Table Pro plan SHALL list included features (20 vehicle listings, vendor profile page, inquiry form leads, email lead notifications, WhatsApp click button, phone click tracking, analytics dashboard, GPS Verified badge eligible) and excluded features displayed with a visual distinction (featured placement, AI SEO content, priority support)
8. THE Pricing_Table Premium plan SHALL list all included features (unlimited vehicle listings, vendor profile page, inquiry form leads, email lead notifications, WhatsApp click button, phone click tracking, advanced analytics dashboard, featured placement, AI SEO content generation, GPS Verified badge eligible, 24/7 priority support)
9. WHEN the user clicks a plan CTA button (labeled "Start Free - [Plan Name]"), THE Pricing_Table SHALL navigate to the vendor sign-up flow with the selected plan identifier pre-selected in the registration form
10. THE Pricing_Table SHALL render plan cards stacked vertically in a single column at viewport widths below 768px, and side-by-side in a row at viewport widths of 768px and above
11. THE Pricing_Table SHALL display trust-building microcopy near each CTA: "14-day trial", "No credit card required", "Cancel anytime"
12. THE Pricing_Table SHALL include a note below the cards explaining that vendors can upgrade their plan as their fleet grows

### Requirement 5: Browse and Search Pages

**User Story:** As a customer, I want to browse and search vehicles on clean, scannable pages, so that I can quickly find and compare rental options.

#### Acceptance Criteria

1. THE Public_Pages search page SHALL display vehicle results in a responsive card grid where the layout renders 1 column at viewports below 768px, 2 columns between 768px and 1279px, and 3 columns at 1280px and above, with white background cards, box-shadow on each card, and uniform gap spacing between all cards
2. THE Public_Pages search page SHALL include a filter sidebar that is visible on viewports 1024px and above and accessible via a toggle button on viewports below 1024px, providing form controls for location, vehicle type, price range (with minimum 0 and maximum bounded numeric inputs), and transmission type
3. THE Public_Pages car detail page SHALL display vehicle information in a two-column layout (main content and sidebar) containing an image gallery, a specifications grid showing seats, fuel type, transmission, and branch location, a pricing panel showing price per day in AUD, a vendor contact widget with phone link, and an enquiry form
4. WHEN no search results match the active filters, THE Public_Pages search page SHALL display an empty state containing a placeholder graphic, a heading indicating no vehicles were found, a text message suggesting the user adjust filters, and a button that clears all active filters
5. THE Public_Pages vehicle cards SHALL display vehicle image, vehicle name, category badge, price per day in AUD, vendor name, location, and a primary call-to-action button linking to the vehicle detail page, where hovering over the card increases its box-shadow elevation
6. IF the search API request fails, THEN THE Public_Pages search page SHALL display an error message indicating the search could not be completed and a retry button that re-initiates the search request
7. THE Public_Pages search page SHALL paginate results at a maximum of 20 vehicles per page and display pagination controls showing current page position, previous and next navigation buttons, and visible page number indicators

### Requirement 6: Vendor Pages

**User Story:** As a customer, I want vendor profile pages that look professional, so that I can evaluate vendor credibility before enquiring.

#### Acceptance Criteria

1. THE Public_Pages vendor profile page SHALL display vendor name, logo/avatar (or a default placeholder when none is provided), verified badge status, location (city and state), fleet size (vehicle count), average rating rounded to one decimal place with review count, and description (up to 2000 characters) in a structured header section
2. THE Public_Pages vendor profile page SHALL list up to 12 vendor vehicles using the same VehicleCard grid layout (responsive columns: 1 on mobile, 2 on tablet, 3 on desktop) used on the search page
3. IF the vendor has more than 12 approved vehicles, THEN THE Public_Pages vendor profile page SHALL display a "View all" link that navigates to the search page filtered by that vendor
4. THE Public_Pages vendor profile page SHALL display customer reviews showing star rating (1-5), review text, reviewer name, and review date, limited to approved reviews only
5. IF the vendor has no approved reviews, THEN THE Public_Pages vendor profile page SHALL display an empty-state message indicating no reviews are available yet
6. IF the requested vendor slug does not match an approved vendor, THEN THE Public_Pages SHALL return a not-found page

### Requirement 7: Auth Pages Premium Treatment

**User Story:** As a vendor signing up, I want the authentication pages to feel secure and premium, so that I trust entering my credentials on this platform.

#### Acceptance Criteria

1. THE Auth_Pages SHALL display a centered card layout with a maximum content width of 768px on a light gradient background with the RentLeads logo, form inputs styled with the Design_System tokens, and a primary submit button
2. WHILE the viewport width is at or above 1024px, THE Auth_Pages SHALL display a value proposition panel adjacent to the form containing at minimum a platform tagline and three benefit statements or trust indicators
3. WHILE the viewport width is below 1024px, THE Auth_Pages SHALL hide the value proposition panel and display the auth form as a single centered column
4. WHILE the auth form is submitting, THE Auth_Pages SHALL display a loading spinner on the submit button and disable all form inputs and submit controls to prevent duplicate submissions
5. IF an authentication error occurs, THEN THE Auth_Pages SHALL display an inline error message in the destructive color token positioned above or below the form inputs, stating the nature of the failure and a suggested corrective action (e.g., retry, check credentials, or contact support)

### Requirement 8: Vendor Dashboard Premium UI

**User Story:** As a vendor, I want the dashboard to look professional and be easy to navigate, so that I can efficiently manage my fleet and leads.

#### Acceptance Criteria

1. THE Vendor_Dashboard SHALL use a sidebar navigation layout with a fixed width of 260px on desktop, nav items displaying an icon and label with minimum 44px touch-target height, active state highlighting using the primary blue color with a visible background fill, and a collapsible sidebar on viewports below 768px
2. THE Vendor_Dashboard metric cards SHALL use the elevated Card variant with an uppercase label (13px font-size, font-weight 700), a numeric value at 36px or larger font-size with font-weight 800+, an optional trend indicator showing percentage change with directional arrow, and a corresponding category icon in a tinted container
3. THE Vendor_Dashboard data tables SHALL use table styling with a subtle background tint on alternating rows for scannability, sortable column headers indicated by a directional icon, and pagination controls showing 10 rows per page by default with next/previous navigation styled with Design_System primitives
4. THE Vendor_Dashboard forms (vehicle creation, branch management, settings) SHALL use Design_System Input components with a visible text label above each field, optional helper text below the input, and inline validation error messages displayed directly below the invalid field in the destructive color token when validation fails
5. WHEN a dashboard page is loading data, THE Vendor_Dashboard SHALL display skeleton placeholders matching the content layout shape (same height and width as the expected content blocks) with a subtle pulse animation rather than a generic loading spinner
6. IF a dashboard page fails to load data, THEN THE Vendor_Dashboard SHALL display an error state within the content area showing an error message indicating the failure reason and a retry action button

### Requirement 9: Admin Console Consistency

**User Story:** As a platform admin, I want the admin console to follow the same design system, so that the interface is predictable and efficient to use.

#### Acceptance Criteria

1. THE Admin_Console SHALL render all UI elements (tables, forms, cards, buttons, and navigation) exclusively using Design_System tokens for color, spacing, typography, and border-radius, with no inline or hard-coded style values outside the token set
2. THE Admin_Console SHALL use the same shared sidebar navigation shell component as the Vendor_Dashboard, configured with admin-specific navigation items, maintaining identical layout grid (sidebar width, header height, and content area positioning)
3. THE Admin_Console data tables SHALL support column sorting (ascending and descending), at least one filter control per table, and pagination with a default page size of 20 rows and selectable page sizes of 10, 20, and 50
4. WHEN the admin navigates to any Admin_Console page, THE Admin_Console SHALL render the page within 2 seconds on a standard broadband connection and display the sidebar navigation in an active state reflecting the current page

### Requirement 10: Conversion Optimization Elements

**User Story:** As the product owner, I want conversion-optimized UI patterns throughout the site, so that visitors convert to leads and vendors convert to paid subscribers.

#### Acceptance Criteria

1. THE Conversion_Element primary CTAs SHALL use the primary blue color (#2563eb) with white text, rounded corners (border-radius lg), minimum padding of 12px vertical and 24px horizontal, and a hover state that darkens the background color by at least one shade to signal interactivity
2. THE Conversion_Element primary CTAs SHALL meet a minimum tap target size of 44×44 CSS pixels and SHALL display a visible focus indicator on keyboard focus
3. THE Conversion_Element headlines SHALL begin with an action verb (e.g., "Find", "Compare", "Save", "Get") followed by a quantified or specific benefit statement rather than a generic description
4. THE Public_Pages SHALL include at least 3 of the following trust signals — verified vendor count, secure payment badge, customer review aggregate, money-back guarantee note — within the same viewport section as a primary CTA (i.e., visible without scrolling when the CTA is visible)
5. THE Pricing_Table SHALL display the text "14-day free trial — no credit card required" within 48px vertical distance below each plan CTA button
6. THE Public_Pages landing page SHALL include a secondary vendor-focused CTA section positioned as the last content section before the site footer, containing a heading with a vendor-specific benefit statement, a supporting description of no more than 200 characters, and a link to the vendor sign-up page

### Requirement 11: Mobile-First Responsive Design

**User Story:** As a mobile user, I want every page to work flawlessly on my phone, so that I can search vehicles or manage my fleet on any device.

#### Acceptance Criteria

1. THE Design_System SHALL define responsive breakpoints at 640px (sm), 768px (md), 1024px (lg), and 1280px (xl) with mobile as the default styling baseline
2. WHILE the viewport width is below 640px, THE Public_Pages layouts SHALL use single-column stacking, cards spanning 100% of the container width, touch targets of minimum 44x44px, body text of minimum 16px, and no horizontal scrollbar visible at any scroll position
3. WHILE the viewport width is below 768px, THE Vendor_Dashboard sidebar SHALL collapse into a bottom tab bar or hamburger drawer such that the primary content area occupies at least 90% of the viewport width
4. THE Global_Layout navigation, forms, modals, and interactive elements SHALL be fully operable via tap, swipe, and long-press gestures with no interaction requiring hover as the only means of activation
5. WHILE the viewport width is below 768px, THE Global_Layout modals SHALL render at a maximum width of 100% of the viewport, be vertically scrollable when content exceeds the viewport height, and include a visible close button of at least 44x44px

### Requirement 12: Error, Loading, and Empty States

**User Story:** As a user encountering edge cases, I want polished feedback states, so that the platform never feels broken or unfinished.

#### Acceptance Criteria

1. WHEN a page encounters a runtime error, THE Global_Layout SHALL display an error state styled with Design_System tokens containing a message indicating what went wrong, a "Try Again" button that re-attempts the failed operation, and a navigation link to the home page
2. WHILE data is being fetched, THE Global_Layout SHALL display skeleton loader placeholders that match the dimensions and arrangement of the expected content, rendered with a pulse animation cycling between 40% and 90% opacity over a 1.5-second duration
3. WHEN a list or grid has zero items, THE Global_Layout SHALL display an empty state containing an icon related to the content type, a single-sentence message explaining why no items are shown, and a CTA button directing the user to an action that can populate the list
4. IF a 404 page is reached, THEN THE Global_Layout SHALL display a not-found page styled with Design_System tokens and the RentLeads wordmark, a message indicating the page does not exist, and at least two navigation links including a link to the home page and a link to the search page
5. IF the "Try Again" action on an error state fails a second consecutive time, THEN THE Global_Layout SHALL continue to display the error state with the retry button still available and the navigation link to the home page

### Requirement 13: Performance and Code Quality

**User Story:** As a developer, I want the redesigned UI to be fast, maintainable, and production-grade, so that the premium look does not come at the cost of performance or code health.

#### Acceptance Criteria

1. THE Design_System SHALL NOT introduce any new runtime dependency that adds more than 50 KB to the gzipped client bundle, and SHALL limit icon usage to the lucide-react package and CSS tooling to the existing Tailwind CSS and shadcn/ui stack
2. THE Public_Pages SHALL achieve a Lighthouse Performance score of 90 or above on a simulated mobile connection (Moto G Power on 4G throttling) with each page route delivering no more than 200 KB of client-side JavaScript (gzipped), all images served via next/image with explicit width and height attributes, and no render-blocking CSS beyond the initial Tailwind utility layer
3. THE Design_System shared components SHALL export from the @/components/ui path with TypeScript interface definitions for all public props, and each interactive component SHALL include aria-label or aria-labelledby attributes, a declared role where applicable, and support for keyboard focus and activation via Tab and Enter/Space keys
4. THE Global_Layout SHALL preserve all existing route paths, API endpoints, authentication flows, and form submission behaviors, verified by confirming that the application builds without errors (`next build` succeeds) and all existing automated tests pass without modification
5. WHEN a pull request is submitted that modifies files within the Design_System or Public_Pages, THE CI_Pipeline SHALL run the lint check (`eslint`), type check (`tsc --noEmit`), and test suite (`vitest run`), and the pull request SHALL NOT be merged if any of these checks fail
