# Requirements Document

## Introduction

This specification defines the mobile optimisation requirements for the HireCar Marketplace website (hirecar.com.au). The site is a Next.js application deployed on Vercel using Tailwind CSS v4 and React 19. While basic responsive breakpoints exist across components, the site lacks dedicated mobile-first optimisations for touch interactions, performance on cellular networks, viewport handling for modern devices (notches, dynamic toolbars), and native-feeling mobile UX patterns. These requirements aim to elevate the mobile experience to match the standards users expect from modern booking and marketplace platforms.

## Glossary

- **Mobile_Viewport**: A screen with a width of 767px or less, typically a smartphone in portrait orientation.
- **Tablet_Viewport**: A screen with a width between 768px and 1023px, typically a tablet in portrait orientation.
- **Touch_Target**: An interactive element (button, link, input) that a user taps with a finger on a touchscreen device.
- **Safe_Area**: The region of the screen not obscured by hardware features such as notches, rounded corners, or system UI bars on modern mobile devices.
- **Viewport_Unit_Dynamic**: CSS dynamic viewport units (dvh, dvw) that account for browser chrome visibility changes (e.g. address bar hiding on scroll).
- **Cumulative_Layout_Shift**: A Core Web Vital metric measuring unexpected visual movement of page content during loading.
- **First_Contentful_Paint**: A Core Web Vital metric measuring the time from navigation to the first visible content rendered on screen.
- **Largest_Contentful_Paint**: A Core Web Vital metric measuring the time from navigation to the largest visible content element rendered on screen.
- **Touch_Gesture**: A finger interaction pattern such as swipe, pinch, or long-press performed on a touchscreen.
- **Mobile_Navigation**: The primary site navigation system as rendered on the Mobile_Viewport, currently a full-screen slide-over menu.
- **Sticky_CTA**: A call-to-action element fixed to the bottom of the Mobile_Viewport that remains visible during scrolling.
- **Input_Zoom_Prevention**: A technique to prevent mobile browsers (particularly iOS Safari) from zooming into form fields when they receive focus, achieved by ensuring font-size is at least 16px on inputs.
- **Service_Worker**: A browser-level script that intercepts network requests to enable offline caching and faster repeat visits.
- **Critical_CSS**: The minimal CSS required to render above-the-fold content, inlined into the HTML document for faster initial paint.
- **Responsive_Image**: An image that serves different file sizes and formats depending on the requesting device's screen size and capabilities.
- **HireCar_System**: The HireCar Marketplace Next.js web application including all public-facing pages, vendor dashboards, and customer areas.

## Requirements

### Requirement 1: Touch Target Sizing

**User Story:** As a mobile user, I want all interactive elements to be large enough to tap comfortably, so that I do not accidentally tap the wrong element.

#### Acceptance Criteria

1. THE HireCar_System SHALL render all Touch_Target elements with a minimum size of 44x44 CSS pixels on Mobile_Viewport and Tablet_Viewport.
2. THE HireCar_System SHALL maintain a minimum spacing of 8px between adjacent Touch_Target elements on Mobile_Viewport.
3. WHEN a Touch_Target has a visual size smaller than 44x44px, THE HireCar_System SHALL extend the tappable area using padding or pseudo-elements to meet the minimum size.
4. THE HireCar_System SHALL maintain Touch_Target minimum sizes on footer navigation links across all viewports including Tablet_Viewport where inline layout is used.

### Requirement 2: Touch Gesture Support for Image Gallery

**User Story:** As a mobile user browsing vehicle listings, I want to swipe through vehicle images with my finger, so that I can view all photos naturally without hunting for small arrow buttons.

#### Acceptance Criteria

1. WHEN the user performs a horizontal swipe Touch_Gesture on the image gallery on Mobile_Viewport, THE HireCar_System SHALL navigate to the next or previous image in the gallery.
2. WHEN the user performs a pinch Touch_Gesture on a gallery image on Mobile_Viewport, THE HireCar_System SHALL zoom into the image proportionally.
3. THE HireCar_System SHALL display pagination indicators (dots or counter) below the gallery on Mobile_Viewport showing the current image position and total count.
4. THE HireCar_System SHALL hide the arrow navigation buttons on Mobile_Viewport and rely on swipe gestures and pagination indicators.

### Requirement 3: Mobile Navigation Enhancements

**User Story:** As a mobile user, I want the navigation to feel responsive and provide access to key sections without excessive scrolling, so that I can quickly reach any part of the site.

#### Acceptance Criteria

1. THE HireCar_System SHALL render the Mobile_Navigation as a slide-in drawer from the right edge (not a full-screen overlay) with a semi-transparent backdrop covering the remaining viewport.
2. WHEN the Mobile_Navigation opens, THE HireCar_System SHALL animate the drawer sliding in from the right with a duration of 250ms or less using GPU-accelerated transform.
3. WHEN the Mobile_Navigation is open, THE HireCar_System SHALL prevent background page scrolling.
4. WHEN the Mobile_Navigation is open, THE HireCar_System SHALL trap keyboard focus within the navigation menu for accessibility.
5. WHEN the user swipes right-to-left on the Mobile_Navigation panel, THE HireCar_System SHALL close the navigation menu with a matching slide-out animation.
6. WHEN the user taps the semi-transparent backdrop while Mobile_Navigation is open, THE HireCar_System SHALL close the navigation menu.
7. THE HireCar_System SHALL include location and vehicle category links in the Mobile_Navigation grouped under expandable sections.
8. WHEN the user navigates to a new page via the Mobile_Navigation, THE HireCar_System SHALL close the menu and scroll to the top of the destination page.

### Requirement 4: Mobile Form Input Optimisation

**User Story:** As a mobile user filling in the enquiry form or search widget, I want the correct keyboard type to appear and the form to be comfortable to use, so that I can complete bookings quickly.

#### Acceptance Criteria

1. THE HireCar_System SHALL render all form text inputs with a computed font-size of at least 16px on Mobile_Viewport to achieve Input_Zoom_Prevention on iOS Safari.
2. WHEN an email input field receives focus on Mobile_Viewport, THE HireCar_System SHALL present the email-optimised keyboard by setting the inputMode attribute to "email".
3. WHEN a telephone input field receives focus on Mobile_Viewport, THE HireCar_System SHALL present the telephone keypad by setting the inputMode attribute to "tel".
4. THE HireCar_System SHALL set the autocomplete attribute on name, email, phone, and address fields to enable browser autofill on Mobile_Viewport.
5. WHEN a form submission fails validation on Mobile_Viewport, THE HireCar_System SHALL scroll the first invalid field into the visible viewport and focus it.

### Requirement 5: Safe Area and Viewport Handling

**User Story:** As a user with a modern smartphone (with a notch or dynamic island), I want the site content and fixed elements to respect my device's safe areas, so that nothing is obscured by hardware features.

#### Acceptance Criteria

1. THE HireCar_System SHALL set the viewport meta tag to include "viewport-fit=cover" to enable safe area inset handling.
2. THE HireCar_System SHALL apply Safe_Area padding to the Sticky_CTA element on Mobile_Viewport using env(safe-area-inset-bottom).
3. THE HireCar_System SHALL apply Safe_Area padding to the fixed site header on Mobile_Viewport using env(safe-area-inset-top).
4. THE HireCar_System SHALL use Viewport_Unit_Dynamic (dvh) for full-height layouts such as the Mobile_Navigation overlay to account for browser chrome.
5. WHILE the mobile browser address bar is visible, THE HireCar_System SHALL render full-screen overlays within the visible viewport without content being cut off.

### Requirement 6: Mobile Performance Optimisation

**User Story:** As a mobile user on a cellular network, I want pages to load fast and feel responsive, so that I do not abandon the site while waiting.

#### Acceptance Criteria

1. THE HireCar_System SHALL achieve a Largest_Contentful_Paint of 2.5 seconds or less on a simulated 4G mobile connection for the homepage.
2. THE HireCar_System SHALL achieve a Cumulative_Layout_Shift score of 0.1 or less on all public pages when loaded on Mobile_Viewport.
3. THE HireCar_System SHALL serve Responsive_Image variants using the Next.js Image component with appropriate sizes attributes tuned for Mobile_Viewport, Tablet_Viewport, and desktop breakpoints.
4. THE HireCar_System SHALL lazy-load images that are below the fold on Mobile_Viewport using native loading="lazy" or the Next.js Image priority mechanism.
5. THE HireCar_System SHALL defer loading of non-critical JavaScript (analytics, Turnstile widget) until after First_Contentful_Paint on Mobile_Viewport.
6. THE HireCar_System SHALL preload the LCP image on the homepage hero section for Mobile_Viewport using a link rel="preload" tag with appropriate media queries.

### Requirement 7: Responsive Typography and Spacing

**User Story:** As a mobile user, I want text to be legible and layouts to use space efficiently on smaller screens, so that I can read content without zooming or excessive scrolling.

#### Acceptance Criteria

1. THE HireCar_System SHALL render body text at a minimum font-size of 16px on Mobile_Viewport.
2. THE HireCar_System SHALL scale heading elements (h1, h2, h3) proportionally between Mobile_Viewport and desktop using a fluid type scale or responsive Tailwind classes.
3. THE HireCar_System SHALL limit paragraph line length to a maximum of 75 characters on Mobile_Viewport for comfortable reading.
4. THE HireCar_System SHALL reduce horizontal padding from the desktop value to a maximum of 16px (1rem) on Mobile_Viewport for content containers.
5. THE HireCar_System SHALL ensure that no horizontal scrolling occurs on Mobile_Viewport for any page layout (overflow-x hidden on the body or main container).

### Requirement 8: Mobile Search Experience

**User Story:** As a mobile user looking for a rental car, I want the search and filter experience to be optimised for one-handed use, so that I can find vehicles efficiently on my phone.

#### Acceptance Criteria

1. WHEN the search widget is rendered on Mobile_Viewport, THE HireCar_System SHALL stack all input fields vertically with full-width layout.
2. WHEN the user taps the filter button on the search results page on Mobile_Viewport, THE HireCar_System SHALL open the filter panel as a bottom-sheet or full-height slide-over from the right edge.
3. THE HireCar_System SHALL display a floating filter button with the active filter count as a badge on Mobile_Viewport on the search results page.
4. WHEN the user applies filters on Mobile_Viewport, THE HireCar_System SHALL display a dismissible chip row above search results showing active filters.
5. THE HireCar_System SHALL position the search button within comfortable thumb reach (lower half of the screen) on Mobile_Viewport for the search results page filter panel.

### Requirement 9: Mobile Vehicle Detail Page Optimisation

**User Story:** As a mobile user viewing a vehicle listing, I want the most important information (price, images, booking action) to be immediately accessible without excessive scrolling, so that I can make quick decisions.

#### Acceptance Criteria

1. THE HireCar_System SHALL display the Sticky_CTA bar at the bottom of Mobile_Viewport on the vehicle detail page showing the price and a booking action button.
2. THE HireCar_System SHALL stack the two-column desktop layout (content + sidebar) into a single column on Mobile_Viewport with the enquiry form positioned after the vehicle details.
3. WHEN the user taps the Sticky_CTA button on Mobile_Viewport, THE HireCar_System SHALL smooth-scroll to the enquiry form section.
4. THE HireCar_System SHALL render the vehicle specs grid as a 2-column layout on Mobile_Viewport maintaining legibility of all values.
5. THE HireCar_System SHALL render the breadcrumb navigation as a horizontally scrollable row on Mobile_Viewport without line wrapping, including a gradient scroll indicator on the trailing edge when content overflows.

### Requirement 10: Offline Resilience and PWA Foundations

**User Story:** As a mobile user with intermittent connectivity, I want previously visited pages to remain accessible and the app to feel installed on my device, so that I have a reliable experience.

#### Acceptance Criteria

1. THE HireCar_System SHALL register a Service_Worker that caches static assets (CSS, JS, fonts, icons) using a cache-first strategy.
2. THE HireCar_System SHALL serve a web app manifest file specifying the app name, theme colour (#ea580c), icons, and display mode "standalone".
3. IF a network request fails while the Service_Worker is active, THEN THE HireCar_System SHALL display a user-friendly offline fallback page with a retry button.
4. THE HireCar_System SHALL cache the homepage and vehicle listing pages using a stale-while-revalidate strategy in the Service_Worker.
5. THE HireCar_System SHALL include an "Add to Home Screen" prompt banner for eligible mobile visitors who have visited the site at least twice.

### Requirement 11: Mobile-Optimised Animations and Transitions

**User Story:** As a mobile user, I want animations to feel smooth and not drain my battery or cause jank, so that the site feels polished on my device.

#### Acceptance Criteria

1. THE HireCar_System SHALL use only GPU-accelerated CSS properties (transform, opacity) for animations on Mobile_Viewport.
2. WHEN the user has enabled reduced-motion preferences in their OS settings, THE HireCar_System SHALL disable all non-essential animations and transitions.
3. THE HireCar_System SHALL limit the total number of simultaneously animating elements to 3 on Mobile_Viewport during page scroll to prevent frame drops.
4. THE HireCar_System SHALL complete page transition animations within 300ms on Mobile_Viewport.
5. WHILE a framer-motion animation is active on Mobile_Viewport, THE HireCar_System SHALL apply will-change only for the duration of the animation and remove it after completion.

### Requirement 12: Mobile Accessibility Compliance

**User Story:** As a mobile user with accessibility needs, I want the site to work well with screen readers and other assistive technologies on my phone, so that I can use the service independently.

#### Acceptance Criteria

1. THE HireCar_System SHALL maintain a minimum colour contrast ratio of 4.5:1 for body text and 3:1 for large text on Mobile_Viewport.
2. WHEN the Mobile_Navigation opens or closes, THE HireCar_System SHALL announce the state change to assistive technologies using appropriate ARIA attributes (aria-expanded, aria-hidden).
3. THE HireCar_System SHALL provide visible focus indicators on all interactive elements when navigated via external keyboard on Mobile_Viewport.
4. THE HireCar_System SHALL label all icon-only buttons with an accessible name using aria-label or visually-hidden text.
5. WHEN an image fails to load on Mobile_Viewport, THE HireCar_System SHALL display the alt text description within the image placeholder area.

### Requirement 13: Z-Index Layering and Conflict Resolution

**User Story:** As a mobile user, I want floating elements (WhatsApp button, sticky CTAs, header, modals) to layer correctly without overlapping each other, so that I can always interact with the intended element.

#### Acceptance Criteria

1. THE HireCar_System SHALL define a z-index scale where fixed header uses z-40, Sticky_CTA uses z-50, floating WhatsApp button uses z-50, Mobile_Navigation overlay uses z-60, and modal dialogs use z-70.
2. WHILE the Sticky_CTA is visible on the vehicle detail page on Mobile_Viewport, THE HireCar_System SHALL reposition the floating WhatsApp button above the Sticky_CTA bar with a minimum gap of 12px.
3. WHEN a modal or Mobile_Navigation overlay is open, THE HireCar_System SHALL hide the floating WhatsApp button to prevent interaction conflicts.
4. THE HireCar_System SHALL ensure no z-index conflict causes an interactive element to be obscured by another interactive element on Mobile_Viewport.

### Requirement 14: Responsive Header Spacing

**User Story:** As a mobile user, I want the page content to begin immediately below the fixed header regardless of the header's rendered height, so that no content is hidden behind the header.

#### Acceptance Criteria

1. THE HireCar_System SHALL calculate the header spacer height dynamically based on the rendered header element height rather than using a hardcoded pixel value.
2. WHEN the header height changes due to viewport resizing or content changes, THE HireCar_System SHALL update the spacer height to match within a single animation frame.
3. THE HireCar_System SHALL use a CSS variable or JavaScript-measured value to synchronise the header height with the main content offset on Mobile_Viewport and Tablet_Viewport.

### Requirement 15: Landscape Orientation Support

**User Story:** As a mobile user who rotates their phone to landscape, I want the layout to adapt without breaking or requiring a page reload, so that I can browse comfortably in either orientation.

#### Acceptance Criteria

1. WHEN the device orientation changes between portrait and landscape, THE HireCar_System SHALL re-render layouts without triggering a page reload or full re-mount.
2. WHILE the device is in landscape orientation on Mobile_Viewport, THE HireCar_System SHALL reduce vertical spacing and header height to maximise content area.
3. WHILE the device is in landscape orientation on Mobile_Viewport, THE HireCar_System SHALL render the vehicle image gallery with a maximum height of 50vh to leave room for navigation and content below.
4. THE HireCar_System SHALL maintain all Touch_Target minimum sizes (44x44px) in both portrait and landscape orientations.

### Requirement 16: Scroll Indicators and Visual Affordances

**User Story:** As a mobile user, I want visual cues that indicate when content extends beyond the visible area, so that I know to scroll or swipe to see more.

#### Acceptance Criteria

1. WHEN the breadcrumb navigation overflows horizontally on Mobile_Viewport, THE HireCar_System SHALL display a gradient fade on the trailing edge indicating more content is available.
2. WHEN a horizontally scrollable container reaches its scroll start, THE HireCar_System SHALL hide the leading-edge scroll indicator.
3. WHEN a horizontally scrollable container reaches its scroll end, THE HireCar_System SHALL hide the trailing-edge scroll indicator.
4. THE HireCar_System SHALL display a scroll-to-top button on Mobile_Viewport after the user scrolls down more than 2 viewport heights on long pages.
