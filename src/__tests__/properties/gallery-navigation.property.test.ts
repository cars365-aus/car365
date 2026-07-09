// Feature: mobile-optimisation, Property 1: Gallery index navigation wraps correctly

/**
 * Property Test: Gallery index navigation wraps correctly
 *
 * For any image gallery with N images (N >= 1) and any current index I
 * (0 <= I < N), swiping left should produce index `(I + 1) % N` and swiping
 * right should produce index `(I - 1 + N) % N`.
 *
 * **Validates: Requirements 2.1**
 *
 * This mirrors the navigation logic in `src/components/image-gallery.tsx`:
 *   handleNext: setCurrentIndex((prev) => (prev + 1) % images.length)
 *   handlePrev: setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
 * where swipe-left invokes handleNext and swipe-right invokes handlePrev.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

/**
 * Pure reproduction of the "next image" computation performed inside the
 * gallery on a swipe-left gesture.
 */
function navigateNext(currentIndex: number, total: number): number {
  return (currentIndex + 1) % total;
}

/**
 * Pure reproduction of the "previous image" computation performed inside the
 * gallery on a swipe-right gesture.
 */
function navigatePrev(currentIndex: number, total: number): number {
  return (currentIndex - 1 + total) % total;
}

/**
 * Generate a valid (total, index) pair where total >= 1 and 0 <= index < total.
 */
const galleryState = fc
  .integer({ min: 1, max: 1000 })
  .chain((total) =>
    fc.tuple(
      fc.constant(total),
      fc.integer({ min: 0, max: total - 1 })
    )
  );

describe("Property 1: Gallery index navigation wraps correctly", () => {
  it("swipe-left produces (I + 1) % N", () => {
    fc.assert(
      fc.property(galleryState, ([total, index]) => {
        const next = navigateNext(index, total);
        expect(next).toBe((index + 1) % total);
        // Result is always a valid index within bounds.
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(total);
      }),
      PBT_CONFIG
    );
  });

  it("swipe-right produces (I - 1 + N) % N", () => {
    fc.assert(
      fc.property(galleryState, ([total, index]) => {
        const prev = navigatePrev(index, total);
        expect(prev).toBe((index - 1 + total) % total);
        // Result is always a valid index within bounds.
        expect(prev).toBeGreaterThanOrEqual(0);
        expect(prev).toBeLessThan(total);
      }),
      PBT_CONFIG
    );
  });

  it("wraps forward from the last image to the first", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (total) => {
        // At the last index, swipe-left wraps to 0.
        expect(navigateNext(total - 1, total)).toBe(0);
      }),
      PBT_CONFIG
    );
  });

  it("wraps backward from the first image to the last", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (total) => {
        // At index 0, swipe-right wraps to the last index.
        expect(navigatePrev(0, total)).toBe(total - 1);
      }),
      PBT_CONFIG
    );
  });

  it("next then prev returns to the original index (round trip)", () => {
    fc.assert(
      fc.property(galleryState, ([total, index]) => {
        expect(navigatePrev(navigateNext(index, total), total)).toBe(index);
        expect(navigateNext(navigatePrev(index, total), total)).toBe(index);
      }),
      PBT_CONFIG
    );
  });
});
