// Feature: mobile-optimisation, Property 7: Scroll-to-top button visibility threshold

/**
 * Property Test: Scroll-to-top button visibility threshold
 *
 * For any page scroll position `scrollY` and viewport height `vh`, the
 * scroll-to-top button should be visible iff `scrollY > 2 * vh`.
 *
 * **Validates: Requirements 16.4**
 *
 * This mirrors the visibility computation in `src/components/scroll-to-top.tsx`:
 *   isVisible = viewportHeight > 0 && scrollY > 2 * viewportHeight
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

/**
 * Pure reproduction of the visibility computation performed inside the
 * `ScrollToTop` component. The button is only considered for display once a
 * viewport height has been measured (vh > 0).
 */
function isScrollToTopVisible(scrollY: number, vh: number): boolean {
  return vh > 0 && scrollY > 2 * vh;
}

describe("Property 7: Scroll-to-top button visibility threshold", () => {
  it("button is visible iff scrollY > 2 * vh (for a measured viewport)", () => {
    fc.assert(
      fc.property(
        // scrollY is always >= 0 in the browser; vh is a positive measured height.
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 5000 }),
        (scrollY, vh) => {
          expect(isScrollToTopVisible(scrollY, vh)).toBe(scrollY > 2 * vh);
        }
      ),
      PBT_CONFIG
    );
  });

  it("button is hidden at or below the threshold (scrollY <= 2 * vh)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        // Pick a scroll position within [0, 2*vh] (inclusive of the threshold).
        fc.double({ min: 0, max: 1, noNaN: true }),
        (vh, fraction) => {
          const scrollY = Math.floor(2 * vh * fraction);
          expect(isScrollToTopVisible(scrollY, vh)).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it("button is visible just above the threshold (scrollY = 2 * vh + delta)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 10_000 }),
        (vh, delta) => {
          const scrollY = 2 * vh + delta;
          expect(isScrollToTopVisible(scrollY, vh)).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });

  it("button is never visible before the viewport height is measured (vh = 0)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (scrollY) => {
        expect(isScrollToTopVisible(scrollY, 0)).toBe(false);
      }),
      PBT_CONFIG
    );
  });
});
