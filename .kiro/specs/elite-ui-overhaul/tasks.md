# Implementation Plan: Elite UI Overhaul

## Overview

Token-first premium redesign of the entire RentLeads platform. Start by redefining CSS custom properties in `globals.css` so the new navy/blue palette cascades to all existing shadcn/ui components automatically. Then enhance primitives with new variants, rebuild global layout components, and progressively restyle each page surface. Finish with property-based tests and build verification.

## Tasks

- [x] 1. Design System Foundation — Tokens and Primitives
  - [x] 1.1 Overhaul CSS custom properties in `src/app/globals.css`
    - Replace all `:root` color tokens with the Premium_Theme palette (primary oklch blue, foreground deep navy, white background, slate neutral scale)
    - Add `.dark` selector tokens with backgrounds ≥ #1e293b and foreground meeting WCAG AA 4.5:1 contrast
    - Add typography tokens (`--font-sans`, `--font-heading` with Inter + system fallback)
    - Add spacing scale, border-radius tokens (`--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`)
    - Add shadow elevation tokens (`--shadow-sm` through `--shadow-xl` with specified blur values)
    - Add heading letter-spacing tokens (-0.02em to -0.04em)
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 11.1_

  - [x] 1.2 Enhance Button component (`src/components/ui/button.tsx`)
    - Add `"cta"` size variant: h-11 (44px) gap-2 px-6 text-base font-bold rounded-lg
    - Ensure all variants (primary, outline, secondary, ghost, destructive, link) use the updated token values
    - Verify disabled, hover, focus, and active states render correctly
    - _Requirements: 1.4, 10.1, 10.2_

  - [x] 1.3 Enhance Card component (`src/components/ui/card.tsx`)
    - Add `variant` prop: `"default" | "elevated" | "interactive"`
    - `elevated`: shadow-md, no border ring
    - `interactive`: shadow-sm, hover:shadow-lg, hover:-translate-y-1, transition-all, cursor-pointer
    - Add optional `size` prop: `"default" | "sm"`
    - _Requirements: 1.4_

  - [x] 1.4 Create Badge component (`src/components/ui/badge.tsx`)
    - Implement variants: default, success, warning, destructive, info, outline
    - Use CVA for variant styling with Design_System tokens
    - _Requirements: 1.4_

  - [x] 1.5 Create Section component (`src/components/ui/section.tsx`)
    - Implement variants: default, muted, navy, gradient
    - Implement size: sm, md, lg (controls vertical padding)
    - Add `container` prop for max-w-7xl mx-auto wrapper
    - _Requirements: 1.4_

  - [x] 1.6 Create Skeleton component (`src/components/ui/skeleton.tsx`)
    - Implement variants: text, circular, rectangular
    - Pulse animation: opacity oscillates 40% → 90% over 1.5s duration
    - _Requirements: 1.4, 12.2_

- [x] 2. Global Layout — SiteHeader and SiteFooter
  - [x] 2.1 Restyle SiteHeader (`src/components/site-header.tsx`)
    - Sticky positioning with white bg at 85% opacity + backdrop-blur
    - RentLeads wordmark, primary nav links, CTA button (44×44px min touch target)
    - Scroll-triggered: after 80px scroll, apply box-shadow and full opacity white bg
    - Mobile hamburger menu (<768px) with slide-in drawer (200-300ms transition)
    - Focus trap inside drawer: trap Tab key, move focus to first element on open, return on close
    - Close button ≥ 44×44px
    - Use `inert` attribute on main content when drawer is open
    - Consistent horizontal padding: 16px mobile, 24px tablet, 32px desktop
    - Max content width 1280px centered
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 11.4_

  - [x] 2.2 Restyle SiteFooter (`src/components/site-footer.tsx`)
    - Deep navy background (#0f172a)
    - Organized link columns: Product, Company, Legal, Support
    - Social media links (lucide-react icons)
    - Copyright notice
    - Responsive column layout (stacked mobile, multi-column desktop)
    - _Requirements: 2.2_

- [x] 3. Checkpoint — Design system and layout
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Landing Page Premium Redesign
  - [x] 4.1 Rebuild landing page hero section (`src/app/page.tsx`)
    - Bold headline: font-weight 900, 48px mobile / 72px desktop, letter-spacing -0.04em
    - Value proposition subtitle ≤ 120 characters
    - SearchWidget component integration (location input + submit)
    - Light gradient or subtle pattern background
    - Priority loading for above-fold content
    - _Requirements: 3.1, 3.8_

  - [x] 4.2 Implement trust signals bar
    - Verified vendor count, total vehicles, customer star rating (numeric/5)
    - Up to 6 partner logos
    - Position immediately below hero
    - _Requirements: 3.2, 10.4_

  - [x] 4.3 Implement How It Works section
    - 3 numbered step cards on white background using existing `step-card.tsx`
    - Icons from lucide-react
    - _Requirements: 3.3_

  - [-] 4.4 Implement featured vehicles grid
    - Up to 6 VehicleCard components using Card `interactive` variant
    - Hover shadow matching Design_System md token
    - "View All" link to search page
    - Conditionally hidden if fewer than 1 vehicle available
    - Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
    - _Requirements: 3.4, 3.9_

  - [-] 4.5 Implement popular locations grid
    - 3-8 LocationCard components with city image (next/image), vehicle count, starting price
    - Responsive grid layout
    - _Requirements: 3.5_

  - [-] 4.6 Implement testimonials section
    - 2-6 TestimonialCard components: quote (max 280 chars), star rating, reviewer name
    - _Requirements: 3.6_

  - [-] 4.7 Implement vendor CTA section
    - Deep navy background (#0f172a) using Section variant="navy"
    - Benefit bullet points
    - Primary CTA button linking to vendor sign-up
    - Heading with action verb + benefit statement
    - Description ≤ 200 characters
    - _Requirements: 3.7, 10.3, 10.6_

  - [x] 4.8 Wire landing page sections in correct order
    - Ensure section order: hero → trust signals → how it works → featured vehicles → locations → testimonials → vendor CTA
    - _Requirements: 3.10_

- [x] 5. Pricing Page
  - [x] 5.1 Create PricingTable component (`src/components/pricing-table.tsx`)
    - Monthly/annual toggle defaulting to monthly
    - "Save 20% annually" label near toggle
    - 3 plan cards: Basic ($29), Pro ($79 with "Most Popular - Best Value" badge), Premium ($179)
    - Annual prices: Basic $278.40, Pro $758.40, Premium $1,718.40
    - Pro card differentiated style (elevated border, distinct background, or scale)
    - "14-day free trial" badge and "No credit card required" on each card
    - Feature inclusion/exclusion lists with check/x icons per plan
    - CTA buttons: "Start Free - [Plan]" → `/auth/sign-in?plan={id}`
    - Microcopy within 48px below CTA: "14-day trial", "No credit card required", "Cancel anytime"
    - Note below cards about upgrading plans
    - Responsive: stacked <768px, side-by-side ≥768px
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 10.5_

  - [x] 5.2 Integrate PricingTable into pricing page (`src/app/(public)/pricing/page.tsx`)
    - Page heading with action verb headline
    - Render PricingTable component
    - _Requirements: 4.1_

- [ ] 6. Search and Browse Pages
  - [x] 6.1 Restyle search page layout (`src/app/(public)/search/page.tsx`)
    - Responsive card grid: 1 col <768px, 2 cols 768-1279px, 3 cols ≥1280px
    - Uniform gap spacing, white bg cards with box-shadow
    - Pagination: 20 per page, prev/next buttons, page number indicators
    - _Requirements: 5.1, 5.7_

  - [-] 6.2 Enhance FilterSidebar (`src/components/filter-sidebar.tsx`)
    - Visible on viewports ≥1024px, toggle button <1024px
    - Form controls: location, vehicle type, price range (min 0, max bounded), transmission
    - _Requirements: 5.2_

  - [x] 6.3 Create EmptyState component (`src/components/empty-state.tsx`)
    - Icon (related to content type), heading, descriptive message, CTA button
    - Wire into search page: display when zero results, with "Clear filters" button
    - _Requirements: 5.4, 12.3_

  - [x] 6.4 Create ErrorState component (`src/components/error-state.tsx`)
    - Error message, "Try Again" retry button, navigation link to home
    - Wire into search page: display on API failure with retry
    - Handle consecutive retry failure (button stays enabled per Req 12.5)
    - _Requirements: 5.6, 12.1, 12.5_

  - [-] 6.5 Restyle VehicleCard (`src/components/vehicle-card.tsx`)
    - Display: vehicle image, name, category badge, price/day AUD, vendor name, location, CTA button
    - Hover: increase box-shadow elevation
    - Use Card `interactive` variant
    - _Requirements: 5.5_

  - [x] 6.6 Restyle car detail page (`src/app/(public)/cars/[slug]/page.tsx`)
    - Two-column layout: main content + sidebar
    - Image gallery, specs grid (seats, fuel, transmission, branch), pricing panel, vendor contact widget, enquiry form
    - _Requirements: 5.3_

- [x] 7. Checkpoint — Public pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Vendor Profile Pages
  - [x] 8.1 Restyle vendor profile page (`src/app/(public)/vendors/[slug]/page.tsx`)
    - Structured header: name, logo/avatar (placeholder fallback), verified badge, location, fleet size, avg rating (1 decimal) with review count, description (≤2000 chars)
    - Vehicle grid: up to 12 cards, same responsive layout as search (1/2/3 cols)
    - "View all" link when >12 vehicles → search page filtered by vendor
    - Reviews section: star rating, review text, reviewer name, date (approved only)
    - Empty state if no approved reviews
    - Not-found page if vendor slug doesn't match approved vendor
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Auth Pages
  - [x] 9.1 Restyle auth sign-in page (`src/app/auth/sign-in/page.tsx`)
    - Split layout ≥1024px: left value proposition panel (tagline + 3 benefit statements) + right form card
    - Single column <1024px: form card only, hide value panel
    - Light gradient bg, centered card max-w-768px
    - RentLeads logo, Design_System styled inputs, primary submit button
    - Loading state: spinner on submit button, all inputs disabled
    - Error state: inline destructive-colored message above/below inputs with failure description and corrective action
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Vendor Dashboard UI
  - [x] 10.1 Enhance DashboardShell (`src/components/dashboard-shell.tsx`)
    - Sidebar: 260px fixed desktop, nav items with icon + label, 44px min touch-target height
    - Active state: primary blue background fill
    - Collapsible on <768px: bottom tab bar or hamburger drawer
    - Content area occupies ≥90% viewport width on mobile
    - Support `mode` prop: "vendor" | "admin" for different nav items
    - _Requirements: 8.1, 9.2, 11.3_

  - [x] 10.2 Restyle MetricCard (`src/components/metric-card.tsx`)
    - Use Card elevated variant
    - Uppercase label: 13px font-size, font-weight 700
    - Numeric value: 36px+ font-size, font-weight 800+
    - Optional trend indicator: percentage + directional arrow
    - Category icon in tinted container
    - _Requirements: 8.2_

  - [x] 10.3 Create DataTable component (`src/components/data-table.tsx`)
    - Alternating row background tint
    - Sortable column headers with directional icon
    - Pagination: 10 rows/page default, prev/next navigation
    - Styled with Design_System primitives
    - _Requirements: 8.3, 9.3_

  - [x] 10.4 Update vendor dashboard pages to use new components
    - Apply DashboardShell, MetricCard, DataTable across vendor pages
    - Forms: visible label above field, helper text below, inline validation errors in destructive color
    - Loading states: skeleton placeholders matching content shape with pulse animation
    - Error states: ErrorState component within content area, sidebar remains functional
    - _Requirements: 8.4, 8.5, 8.6_

- [x] 11. Admin Console Consistency
  - [x] 11.1 Update admin layout to use shared DashboardShell (`src/app/admin/layout.tsx`)
    - Configure DashboardShell with mode="admin" and admin-specific nav items
    - Same layout grid: sidebar width, header height, content area positioning
    - _Requirements: 9.2_

  - [x] 11.2 Update admin pages to use Design_System tokens exclusively
    - Remove any inline or hard-coded style values outside the token set
    - Apply DataTable to admin tables: sorting (asc/desc), filter control per table, pagination (default 20, selectable 10/20/50)
    - Ensure render within 2 seconds, active nav state reflects current page
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 12. Error, Loading, and Empty States — Global Wiring
  - [x] 12.1 Create global not-found page (`src/app/not-found.tsx`)
    - Design_System tokens styling, RentLeads wordmark
    - Message: page does not exist
    - Navigation links: home page + search page (minimum 2)
    - _Requirements: 12.4_

  - [x] 12.2 Wire skeleton loaders across all data-fetching pages
    - Match dimensions and arrangement of expected content
    - Use Skeleton component with pulse animation (40%-90% opacity, 1.5s)
    - Apply to: dashboard metric cards, data tables, search grid, vendor profile
    - _Requirements: 12.2, 8.5_

  - [x] 12.3 Wire EmptyState and ErrorState into remaining pages
    - Ensure every list/grid with zero items shows EmptyState (icon + message + CTA)
    - Ensure every page with data fetching has error boundary with retry + home link
    - _Requirements: 12.1, 12.3, 12.5_

- [x] 13. Checkpoint — All pages restyled
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Property-Based Tests
  - [x] 14.1 Set up fast-check and create test utilities
    - Install fast-check as dev dependency
    - Create `src/__tests__/properties/` directory
    - Set up shared arbitraries for Vehicle, VendorProfile, PricingPlan types
    - Configure minimum 100 iterations per property test
    - _Requirements: 13.5_

  - [x] 14.2 Write property test: UI Primitive Rendering Resilience
    - **Property 1: UI Primitive Rendering Resilience**
    - For any exported UI primitive with any valid prop combination, rendering SHALL succeed without error and produce at least one DOM element
    - Generate random valid prop objects for Button, Card, Badge, Input, Section, Skeleton
    - **Validates: Requirements 1.4, 1.6**

  - [x] 14.3 Write property test: Annual Billing Discount Calculation
    - **Property 2: Annual Billing Discount Calculation**
    - For any monthly price (positive number), annual price SHALL equal `monthlyPrice × 12 × 0.8` rounded to 2 decimal places
    - Generate random positive numbers as monthly prices
    - **Validates: Requirements 4.4**

  - [x] 14.4 Write property test: VehicleCard Field Completeness
    - **Property 3: VehicleCard Field Completeness**
    - For any valid Vehicle object, rendered VehicleCard SHALL contain vehicle name, category, price, vendor name, location, and CTA link
    - Generate random Vehicle objects with non-null required fields
    - **Validates: Requirements 5.5**

  - [x] 14.5 Write property test: Pagination Correctness
    - **Property 4: Pagination Correctness**
    - For any total count and page size of 20, pagination SHALL display `ceil(totalCount / 20)` total pages with current page between 1 and total inclusive
    - Generate random total counts (0-10000)
    - **Validates: Requirements 5.7**

  - [x] 14.6 Write property test: Vendor Profile Field Completeness
    - **Property 5: Vendor Profile Field Completeness**
    - For any valid VendorProfile, rendered header SHALL contain vendor name, location, vehicle count, and rating (when non-null)
    - Generate random VendorProfile objects
    - **Validates: Requirements 6.1**

  - [x] 14.7 Write property test: Vendor Vehicle Display Cap
    - **Property 6: Vendor Vehicle Display Cap**
    - For any vendor with N vehicles (N ≥ 0), display exactly `min(N, 12)` cards; show "View all" when N > 12
    - Generate random vehicle counts 0-100
    - **Validates: Requirements 6.2, 6.3**

  - [x] 14.8 Write property test: Data Table Sort Ordering
    - **Property 7: Data Table Sort Ordering**
    - For any data array and sortable column, ascending sort ensures each value ≤ next; descending ensures each value ≥ next
    - Generate random data arrays and sort configurations
    - **Validates: Requirements 8.3, 9.3**

  - [x] 14.9 Write property test: Empty State Display
    - **Property 8: Empty State Display for Zero-Item Collections**
    - For any list/grid rendered with zero items, output SHALL contain an icon, message, and CTA element
    - Render list components with empty arrays
    - **Validates: Requirements 12.3**

- [ ] 15. Build Verification and CI Quality Gates
  - [x] 15.1 Run `next build` and fix any compilation errors
    - Verify all routes compile successfully
    - Verify no TypeScript errors (`tsc --noEmit`)
    - Verify ESLint passes
    - _Requirements: 13.4_

  - [-] 15.2 Run full test suite (`vitest run`) and fix failures
    - All existing tests must pass without modification
    - Property tests (if implemented) must pass
    - _Requirements: 13.4, 13.5_

  - [x] 15.3 Verify bundle size and dependency constraints
    - No new runtime dependency > 50KB gzipped (only fast-check as devDep is allowed)
    - Icons limited to lucide-react
    - CSS tooling limited to existing Tailwind + shadcn/ui
    - _Requirements: 13.1_

- [x] 16. Final Checkpoint — Production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The token-first approach (Task 1.1) is critical — it cascades the new palette to ALL existing components automatically
- No database or API changes required — this is a pure UI overhaul
- All existing route paths, auth flows, and form behaviors must be preserved
- fast-check is the PBT library (TypeScript-native, integrates with Vitest)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "6.3", "6.4"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6", "4.7", "6.5", "6.2"] },
    { "id": 5, "tasks": ["4.8", "5.1", "6.1", "6.6"] },
    { "id": 6, "tasks": ["5.2", "8.1", "9.1"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 8, "tasks": ["10.4", "11.1"] },
    { "id": 9, "tasks": ["11.2", "12.1"] },
    { "id": 10, "tasks": ["12.2", "12.3"] },
    { "id": 11, "tasks": ["14.1"] },
    { "id": 12, "tasks": ["14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9"] },
    { "id": 13, "tasks": ["15.1"] },
    { "id": 14, "tasks": ["15.2", "15.3"] }
  ]
}
```
