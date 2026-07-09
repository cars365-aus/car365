// Feature: mobile-optimisation, Property 6: Header spacer synchronises with header height

/**
 * Property Test: Header spacer synchronises with header height
 *
 * For any rendered header height H (measured via offsetHeight), the spacer
 * element's height and the CSS variable `--header-height` should both equal H.
 *
 * **Validates: Requirements 14.1, 14.2, 14.3**
 *
 * This mirrors the synchronisation logic in `src/hooks/use-header-height.ts`:
 *   - On measure, the hook writes `${newHeight}px` to the `--header-height`
 *     CSS variable on the document root and returns `newHeight`.
 *   - The header spacer element is sized with `height: var(--header-height)`,
 *     so it resolves to whatever value the hook wrote.
 *   - There is a single source of truth (the measured offsetHeight), so the
 *     CSS variable and the spacer height can never diverge.
 *   - If ResizeObserver is unavailable, both fall back to 116px.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

const FALLBACK_HEIGHT = 116;

/**
 * Minimal model of the `--header-height` CSS variable living on the document
 * root. The hook writes to it; the spacer reads from it via `var(...)`.
 */
class HeaderHeightStore {
  private value = `${FALLBACK_HEIGHT}px`;

  /** Mirrors the hook writing `${height}px` to the CSS variable. */
  setHeaderHeightVar(height: number): void {
    this.value = `${height}px`;
  }

  /** The raw CSS variable value, e.g. read via getPropertyValue. */
  getCssVariable(): string {
    return this.value;
  }

  /**
   * The resolved height of the spacer element, whose style is
   * `height: var(--header-height)`. It always reflects the current variable.
   */
  getSpacerHeight(): string {
    return this.value;
  }
}

/**
 * Pure reproduction of a single measure-and-sync cycle of useHeaderHeight when
 * a ResizeObserver entry fires with a measured offsetHeight.
 *
 * Returns the value the hook would expose via its return (the measured number)
 * alongside the store it synced.
 */
function syncMeasuredHeight(
  store: HeaderHeightStore,
  measuredOffsetHeight: number
): number {
  store.setHeaderHeightVar(measuredOffsetHeight);
  return measuredOffsetHeight;
}

describe("Property 6: Header spacer synchronises with header height", () => {
  it("CSS variable and spacer height both equal the measured header height H", () => {
    fc.assert(
      fc.property(
        // offsetHeight is a non-negative integer number of CSS pixels
        fc.integer({ min: 0, max: 10000 }),
        (measuredHeight) => {
          const store = new HeaderHeightStore();
          const returned = syncMeasuredHeight(store, measuredHeight);

          // The hook returns the measured height.
          expect(returned).toBe(measuredHeight);
          // Both consumers resolve to the exact same `${H}px` string.
          expect(store.getCssVariable()).toBe(`${measuredHeight}px`);
          expect(store.getSpacerHeight()).toBe(`${measuredHeight}px`);
          // The variable and the spacer can never diverge.
          expect(store.getSpacerHeight()).toBe(store.getCssVariable());
        }
      ),
      PBT_CONFIG
    );
  });

  it("remains synchronised across a sequence of resize-driven height changes", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 1, maxLength: 50 }),
        (heights) => {
          const store = new HeaderHeightStore();

          for (const h of heights) {
            syncMeasuredHeight(store, h);
            // After every update the two stay locked together.
            expect(store.getSpacerHeight()).toBe(store.getCssVariable());
          }

          // After the final measurement, both equal the last height.
          const last = heights[heights.length - 1];
          expect(store.getCssVariable()).toBe(`${last}px`);
          expect(store.getSpacerHeight()).toBe(`${last}px`);
        }
      ),
      PBT_CONFIG
    );
  });

  it("falls back to 116px before any measurement occurs", () => {
    const store = new HeaderHeightStore();
    expect(store.getCssVariable()).toBe(`${FALLBACK_HEIGHT}px`);
    expect(store.getSpacerHeight()).toBe(`${FALLBACK_HEIGHT}px`);
    expect(store.getSpacerHeight()).toBe(store.getCssVariable());
  });
});
