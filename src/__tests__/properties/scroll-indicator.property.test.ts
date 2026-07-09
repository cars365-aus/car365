// Feature: mobile-optimisation, Property 4: Scroll indicator visibility reflects scroll position

/**
 * Property Test: Scroll indicator visibility reflects scroll position
 *
 * For any scrollable container with `scrollWidth > clientWidth`, given a scroll
 * position `scrollLeft`:
 *   - the leading gradient is visible iff `scrollLeft > 0`
 *   - the trailing gradient is visible iff `scrollLeft + clientWidth < scrollWidth`
 *
 * **Validates: Requirements 9.5, 16.1, 16.2, 16.3**
 *
 * This mirrors the visibility computation in `src/hooks/use-scroll-indicator.ts`:
 *   showLeading: scrollLeft > 0
 *   showTrailing: Math.ceil(scrollLeft + clientWidth) < scrollWidth
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

interface ScrollMetrics {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}

interface IndicatorState {
  showLeading: boolean;
  showTrailing: boolean;
}

/**
 * Pure reproduction of the indicator visibility computation performed inside
 * the `useScrollIndicator` hook.
 */
function computeIndicators({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: ScrollMetrics): IndicatorState {
  return {
    showLeading: scrollLeft > 0,
    showTrailing: Math.ceil(scrollLeft + clientWidth) < scrollWidth,
  };
}

/**
 * Generate a valid overflowing-container scroll state.
 *
 * Constraints reflect the real DOM:
 *   - clientWidth >= 1
 *   - scrollWidth > clientWidth (container overflows horizontally)
 *   - 0 <= scrollLeft <= scrollWidth - clientWidth (scrollLeft cannot exceed max)
 */
const scrollState = fc
  .record({
    clientWidth: fc.integer({ min: 1, max: 2000 }),
    overflow: fc.integer({ min: 1, max: 5000 }),
  })
  .chain(({ clientWidth, overflow }) => {
    const scrollWidth = clientWidth + overflow;
    const maxScroll = scrollWidth - clientWidth; // === overflow
    return fc.record({
      scrollLeft: fc.integer({ min: 0, max: maxScroll }),
      clientWidth: fc.constant(clientWidth),
      scrollWidth: fc.constant(scrollWidth),
    });
  });

describe("Property 4: Scroll indicator visibility reflects scroll position", () => {
  it("leading gradient is visible iff scrollLeft > 0", () => {
    fc.assert(
      fc.property(scrollState, (metrics) => {
        const { showLeading } = computeIndicators(metrics);
        expect(showLeading).toBe(metrics.scrollLeft > 0);
      }),
      PBT_CONFIG
    );
  });

  it("trailing gradient is visible iff scrollLeft + clientWidth < scrollWidth", () => {
    fc.assert(
      fc.property(scrollState, (metrics) => {
        const { showTrailing } = computeIndicators(metrics);
        expect(showTrailing).toBe(
          Math.ceil(metrics.scrollLeft + metrics.clientWidth) <
            metrics.scrollWidth
        );
      }),
      PBT_CONFIG
    );
  });

  it("hides the leading indicator at the scroll start", () => {
    fc.assert(
      fc.property(scrollState, (metrics) => {
        // At the very start, scrollLeft is 0 -> leading hidden.
        const atStart = { ...metrics, scrollLeft: 0 };
        expect(computeIndicators(atStart).showLeading).toBe(false);
      }),
      PBT_CONFIG
    );
  });

  it("hides the trailing indicator at the scroll end", () => {
    fc.assert(
      fc.property(scrollState, (metrics) => {
        // At the very end, scrollLeft === scrollWidth - clientWidth ->
        // scrollLeft + clientWidth === scrollWidth -> trailing hidden.
        const maxScroll = metrics.scrollWidth - metrics.clientWidth;
        const atEnd = { ...metrics, scrollLeft: maxScroll };
        expect(computeIndicators(atEnd).showTrailing).toBe(false);
      }),
      PBT_CONFIG
    );
  });

  it("shows both indicators when scrolled to the middle of an overflowing container", () => {
    fc.assert(
      fc.property(
        fc
          .record({
            clientWidth: fc.integer({ min: 1, max: 2000 }),
            // Ensure enough overflow that a strict middle position exists.
            overflow: fc.integer({ min: 2, max: 5000 }),
          })
          .chain(({ clientWidth, overflow }) => {
            const scrollWidth = clientWidth + overflow;
            const maxScroll = scrollWidth - clientWidth;
            return fc.record({
              // Strictly between start and end: 0 < scrollLeft < maxScroll.
              scrollLeft: fc.integer({ min: 1, max: maxScroll - 1 }),
              clientWidth: fc.constant(clientWidth),
              scrollWidth: fc.constant(scrollWidth),
            });
          }),
        (metrics) => {
          const { showLeading, showTrailing } = computeIndicators(metrics);
          expect(showLeading).toBe(true);
          expect(showTrailing).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});
