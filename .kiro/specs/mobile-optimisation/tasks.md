# Implementation Plan: Mobile Optimisation

## Overview

This plan implements mobile-first optimisations for the HireCar Marketplace, progressing from foundational CSS tokens and hooks through new components, page-level modifications, and finally PWA setup and testing. Each task builds incrementally on prior work so no code is orphaned.

## Tasks

- [x] 1. Foundational CSS tokens and utilities
  - [x] 1.1 Add z-index scale, fluid typography, touch-target, and safe-area tokens to globals.css
    - Add `:root` CSS variables for `--z-header: 40`, `--z-sticky-cta: 50`, `--z-whatsapp: 50`, `--z-mobile-nav: 60`, `--z-modal: 70`
    - Add `--touch-min: 44px` and `--touch-gap: 8px` tokens
    - Add `--header-height: 116px` fallback CSS variable
    - Add fluid type scale using `clamp()` for h1, h2, h3 headings
    - Add touch-target utility class `.touch-target` ensuring min 44x44px tap areas
    - Add safe-area utility classes using `env(safe-area-inset-*)` for top, bottom, left, right
    - Add landscape media queries reducing vertical spacing and header height
    - Add `overflow-x: hidden` on body/main for mobile
    - Ensure body text minimum 16px and max paragraph width 75ch
    - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5, 13.1, 14.3, 15.2_

  - [x] 1.2 Update layout.tsx viewport meta and manifest link
    - Add `viewport-fit=cover` to the viewport meta tag in metadata export
    - Add `<link rel="manifest" href="/manifest.json">` to the head
    - Add service worker registration script (deferred)
    - _Requirements: 5.1, 5.4, 10.1, 10.2_

- [x] 2. Custom hooks
  - [x] 2.1 Implement useSwipeGesture hook
    - Create `src/hooks/use-swipe-gesture.ts`
    - Accept a ref and `SwipeGestureOptions` (threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown)
    - Use PointerEvents (pointerdown, pointermove, pointerup) for cross-device compatibility
    - Calculate swipe direction and distance; fire callback when threshold exceeded (default 50px)
    - Clean up event listeners on unmount
    - _Requirements: 2.1, 3.5_

  - [x] 2.2 Implement usePinchZoom hook
    - Create `src/hooks/use-pinch-zoom.ts`
    - Track two-finger touch events to calculate pinch distance delta
    - Return `{ scale, origin }` state clamped between `minScale` (default 1) and `maxScale` (default 3)
    - Proportionally scale based on distance change
    - _Requirements: 2.2_

  - [x] 2.3 Implement useHeaderHeight hook
    - Create `src/hooks/use-header-height.ts`
    - Use ResizeObserver to measure header element's offsetHeight
    - Update CSS variable `--header-height` on document root when height changes
    - Return current height value
    - Fall back to 116px if ResizeObserver unavailable
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 2.4 Implement useScrollIndicator hook
    - Create `src/hooks/use-scroll-indicator.ts`
    - Accept a container ref; track scroll position via scroll event listener
    - Return `{ showLeading, showTrailing }` based on scrollLeft vs scrollWidth/clientWidth
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 2.5 Implement useScrollPosition hook
    - Create `src/hooks/use-scroll-position.ts`
    - Track `window.scrollY` via throttled scroll event listener
    - Return current scroll position number
    - _Requirements: 16.4_

  - [x] 2.6 Implement useReducedMotion hook
    - Create `src/hooks/use-reduced-motion.ts`
    - Use `matchMedia('(prefers-reduced-motion: reduce)')` to detect OS preference
    - Return boolean; default to `true` (reduced) if matchMedia unavailable
    - _Requirements: 11.2_

  - [x] 2.7 Implement useBodyScrollLock hook
    - Create `src/hooks/use-body-scroll-lock.ts`
    - When locked, set `overflow: hidden` on `document.body` and handle iOS scroll position preservation
    - Accept boolean `isLocked` parameter; clean up on unmount
    - _Requirements: 3.3_

- [x] 3. Checkpoint - Verify hooks compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. New UI components
  - [x] 4.1 Implement MobileDrawerNav component
    - Create `src/components/mobile-drawer-nav.tsx`
    - Render as a right-sliding drawer (translate-x animation, 250ms, GPU-accelerated transform)
    - Add semi-transparent backdrop; close on backdrop tap
    - Integrate `useBodyScrollLock` to prevent background scroll
    - Implement keyboard focus trap using `aria-modal`, tab cycling
    - Integrate `useSwipeGesture` for swipe-to-close (right-to-left swipe)
    - Include expandable sections for location and category links
    - Close menu on navigation and scroll to top
    - Apply `z-[var(--z-mobile-nav)]` (z-60)
    - Use 100dvh for full-height layout
    - Add ARIA attributes: `aria-expanded`, `aria-hidden` for state announcements
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.4, 5.5, 12.2_

  - [x] 4.2 Implement ScrollIndicator component
    - Create `src/components/scroll-indicator.tsx`
    - Wrap children in a horizontal scroll container
    - Use `useScrollIndicator` hook to show/hide leading and trailing gradient overlays
    - Accept `gradientColor` prop (default white)
    - _Requirements: 9.5, 16.1, 16.2, 16.3_

  - [x] 4.3 Implement ScrollToTop component
    - Create `src/components/scroll-to-top.tsx`
    - Use `useScrollPosition` hook; show button when `scrollY > 2 * window.innerHeight`
    - Animate appearance with framer-motion (opacity + translateY)
    - Respect `useReducedMotion` — skip animation if reduced motion preferred
    - Apply appropriate z-index below modals
    - _Requirements: 16.4, 11.2_

  - [x] 4.4 Implement FilterChips component
    - Create `src/components/filter-chips.tsx`
    - Render one dismissible chip per active filter
    - Each chip has an X button to remove the filter
    - Ensure chips meet 44x44px touch target
    - _Requirements: 8.4, 1.1_

  - [x] 4.5 Implement PaginationDots component
    - Create `src/components/pagination-dots.tsx`
    - Accept `total` and `current` index props
    - Render dots below gallery, highlight current
    - Ensure tappable dots meet touch target sizing
    - _Requirements: 2.3_

  - [x] 4.6 Implement OfflineFallback page
    - Create `src/app/offline/page.tsx`
    - Display friendly offline message with a retry button
    - Retry button calls `window.location.reload()`
    - Style appropriately for mobile
    - _Requirements: 10.3_

  - [x] 4.7 Implement A2HSBanner component
    - Create `src/components/a2hs-banner.tsx`
    - Listen for `beforeinstallprompt` event
    - Show banner to eligible users (visited at least twice — track via localStorage)
    - Provide install and dismiss buttons
    - Animate in from bottom; respect reduced motion
    - _Requirements: 10.5_

- [x] 5. Checkpoint - Verify new components compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Modify existing components — Header and Navigation
  - [x] 6.1 Refactor site-header to use useHeaderHeight and MobileDrawerNav
    - Replace hardcoded `h-[116px]` spacer with dynamic spacer using `--header-height` CSS variable
    - Add ref to header element; pass to `useHeaderHeight`
    - Add `env(safe-area-inset-top)` padding to the fixed header
    - Update header z-index to `z-[var(--z-header)]` (z-40)
    - Replace current mobile menu implementation with `MobileDrawerNav`
    - Reduce header height in landscape orientation via CSS
    - _Requirements: 5.3, 13.1, 14.1, 14.2, 14.3, 15.2_

  - [x] 6.2 Refactor whatsapp-float for context-aware positioning
    - Accept `stickyCtaVisible` prop (boolean)
    - When CTA visible on mobile: set bottom offset to `CTA_height + 12px + 24px`
    - When modal or mobile nav is open: hide the button entirely (visibility or conditional render)
    - Update z-index to `z-[var(--z-whatsapp)]` (z-50)
    - Apply `env(safe-area-inset-bottom)` to base offset
    - _Requirements: 13.2, 13.3, 13.4_

- [x] 7. Modify existing components — Image Gallery
  - [x] 7.1 Add swipe and pinch-zoom to image-gallery
    - Integrate `useSwipeGesture` for horizontal navigation between images
    - Integrate `usePinchZoom` for zoom on touch
    - Apply `will-change: transform` only during gesture, remove after
    - Implement gallery index wrapping: `(index + 1) % N` and `(index - 1 + N) % N`
    - _Requirements: 2.1, 2.2, 11.5_

  - [x] 7.2 Replace arrow buttons with PaginationDots on mobile
    - Hide arrow navigation buttons on mobile viewport (below 768px)
    - Render `PaginationDots` below gallery on mobile
    - Keep arrows visible on desktop/tablet
    - _Requirements: 2.3, 2.4_

  - [x] 7.3 Write property test for gallery index navigation
    - **Property 1: Gallery index navigation wraps correctly**
    - Test that for any N ≥ 1 and 0 ≤ I < N, swipe-left produces `(I + 1) % N` and swipe-right produces `(I - 1 + N) % N`
    - Place in `src/__tests__/properties/gallery-navigation.property.test.ts`
    - **Validates: Requirements 2.1**

  - [x] 7.4 Write property test for pinch zoom scale clamping
    - **Property 2: Pinch zoom scale is proportional and clamped**
    - Test that for any pinch delta, computed scale is within [minScale, maxScale]
    - Place in `src/__tests__/properties/pinch-zoom-scale.property.test.ts`
    - **Validates: Requirements 2.2**

- [x] 8. Modify existing components — Vehicle Detail and Search
  - [x] 8.1 Update cars/[slug]/page for mobile optimisation
    - Add `ScrollIndicator` wrapper around breadcrumb navigation
    - Add sticky CTA bar at bottom of mobile viewport showing price and booking button
    - Apply `env(safe-area-inset-bottom)` to sticky CTA
    - Set sticky CTA z-index to `z-[var(--z-sticky-cta)]` (z-50)
    - Smooth-scroll to enquiry form on CTA tap
    - Stack two-column layout into single column on mobile
    - Render vehicle specs as 2-column grid on mobile
    - Limit gallery height to 50vh in landscape
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 5.2, 15.3_

  - [x] 8.2 Update search page for mobile filter UX
    - Stack search widget inputs vertically with full-width on mobile
    - Convert filter panel to bottom-sheet (or right slide-over) on mobile
    - Add floating filter button with active filter count badge
    - Integrate `FilterChips` above search results
    - Position search/apply button in lower half of screen within filter panel
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.3 Write property test for active filter UI state
    - **Property 3: Active filters produce correct UI state**
    - Test that for 0..N active filters, chip count equals N and badge displays N
    - Place in `src/__tests__/properties/filter-ui-state.property.test.ts`
    - **Validates: Requirements 8.3, 8.4**

  - [x] 8.4 Write property test for scroll indicator visibility
    - **Property 4: Scroll indicator visibility reflects scroll position**
    - Test leading gradient visible iff scrollLeft > 0; trailing visible iff scrollLeft + clientWidth < scrollWidth
    - Place in `src/__tests__/properties/scroll-indicator.property.test.ts`
    - **Validates: Requirements 9.5, 16.1, 16.2, 16.3**

- [x] 9. Modify existing components — WhatsApp repositioning and vehicle-card
  - [x] 9.1 Update vehicle-card touch targets
    - Ensure all interactive elements (links, buttons) meet 44x44px minimum via padding or pseudo-elements
    - Maintain 8px minimum spacing between adjacent targets
    - Apply touch-target utility class where needed
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.2 Write property test for WhatsApp button repositioning
    - **Property 5: WhatsApp button repositions above sticky CTA**
    - Test that for any CTA height H > 0, bottom offset equals H + 12 + 24
    - Place in `src/__tests__/properties/whatsapp-reposition.property.test.ts`
    - **Validates: Requirements 13.2**

  - [x] 9.3 Write property test for header spacer synchronisation
    - **Property 6: Header spacer synchronises with header height**
    - Test that for any measured header height H, CSS variable and spacer equal H
    - Place in `src/__tests__/properties/header-spacer.property.test.ts`
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 10. Form optimisation and accessibility
  - [x] 10.1 Optimise mobile form inputs across all forms
    - Ensure all text inputs have computed font-size ≥ 16px on mobile (prevents iOS zoom)
    - Add `inputMode="email"` to email fields, `inputMode="tel"` to phone fields
    - Add appropriate `autocomplete` attributes to name, email, phone, address fields
    - On validation failure: scroll first invalid field into view and focus it
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 10.2 Ensure mobile accessibility compliance
    - Verify colour contrast ratio ≥ 4.5:1 for body text and ≥ 3:1 for large text
    - Add visible focus indicators on all interactive elements for keyboard navigation
    - Add `aria-label` or visually-hidden text to all icon-only buttons
    - Ensure alt text displays in placeholder area when images fail to load
    - Ensure footer nav links meet 44x44px touch targets on all viewports including tablet
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 1.4_

- [x] 11. Checkpoint - Verify modified components compile and render
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Animation governance
  - [x] 12.1 Implement mobile animation constraints
    - Ensure all mobile animations use only `transform` and `opacity` (GPU-accelerated)
    - Apply `will-change` only during animation lifetime, remove after completion (framer-motion `onAnimationComplete`)
    - Limit concurrent animating elements to 3 on mobile during scroll
    - Ensure page transitions complete within 300ms
    - Integrate `useReducedMotion` hook — disable non-essential animations when OS preference set
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 13. Performance optimisation
  - [x] 13.1 Optimise images and loading for mobile
    - Ensure Next.js Image components have appropriate `sizes` attributes for mobile/tablet/desktop
    - Apply `loading="lazy"` to below-fold images; use `priority` for above-fold hero
    - Add `<link rel="preload">` for LCP hero image with mobile media query
    - Defer non-critical JS (analytics, Turnstile) until after FCP using `next/script` strategy "lazyOnload"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 14. PWA setup
  - [x] 14.1 Create manifest.json and service worker
    - Create `public/manifest.json` with app name "HireCar", theme_color "#ea580c", display "standalone", icons array
    - Create `public/sw.js` implementing:
      - Cache-first for static assets (CSS, JS, fonts)
      - Stale-while-revalidate for homepage and listing pages
      - Cache-first for images (7-day TTL)
      - Network-first for API calls
      - Offline fallback to `/offline` page on network failure
    - Create placeholder PWA icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 14.2 Register service worker in layout.tsx
    - Add conditional SW registration in a client component or script tag
    - Handle registration failure gracefully (console.log, no user-facing error)
    - _Requirements: 10.1_

  - [x] 14.3 Write property test for scroll-to-top visibility threshold
    - **Property 7: Scroll-to-top button visibility threshold**
    - Test that for any scrollY and vh, button visible iff scrollY > 2 * vh
    - Place in `src/__tests__/properties/scroll-to-top.property.test.ts`
    - **Validates: Requirements 16.4**

- [x] 15. Landscape orientation and final wiring
  - [x] 15.1 Ensure landscape orientation support
    - Verify layouts re-render without page reload on orientation change (React handles this naturally)
    - Apply reduced vertical spacing and header height in landscape via CSS media queries (already in 1.1)
    - Ensure gallery max-height 50vh in landscape (already in 8.1)
    - Verify all touch targets remain 44x44px in both orientations
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 15.2 Wire ScrollToTop into layout and connect WhatsApp visibility
    - Add `ScrollToTop` component to root layout or public layout
    - Connect WhatsApp float visibility to mobile nav open state and modal state via context or prop drilling
    - Ensure no z-index conflicts between all floating elements
    - _Requirements: 16.4, 13.3, 13.4_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The tech stack is Next.js App Router + Tailwind CSS v4 + shadcn/ui + framer-motion + TypeScript
- All hooks and components are client-side ("use client" directive required)
- The service worker is a plain JS file in `/public` — no build step needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"] },
    { "id": 3, "tasks": ["6.1", "6.2", "7.1", "9.1"] },
    { "id": 4, "tasks": ["7.2", "7.3", "7.4", "8.1", "8.2"] },
    { "id": 5, "tasks": ["8.3", "8.4", "9.2", "9.3", "10.1", "10.2"] },
    { "id": 6, "tasks": ["12.1", "13.1"] },
    { "id": 7, "tasks": ["14.1"] },
    { "id": 8, "tasks": ["14.2", "14.3", "15.1", "15.2"] }
  ]
}
```
