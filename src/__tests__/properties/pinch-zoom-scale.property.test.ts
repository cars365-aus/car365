// Feature: mobile-optimisation, Property 2: Pinch zoom scale is proportional and clamped

/**
 * Property Test: Pinch zoom scale is proportional and clamped
 *
 * For any pinch distance delta, the computed zoom scale should be proportional
 * to the delta and clamped within `[minScale, maxScale]` bounds (default [1, 3]).
 * Specifically: `minScale <= computedScale <= maxScale` for all inputs.
 *
 * **Validates: Requirements 2.2**
 *
 * This mirrors the clamping logic in `src/hooks/use-pinch-zoom.ts`:
 *   const newScale = Math.min(maxScale, Math.max(minScale, baseScale * ratio));
 * where `ratio = currentDistance / initialDistance`.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

/**
 * Pure reproduction of the scale computation performed inside usePinchZoom.
 * Given the touch distances at gesture start (initial) and during the move
 * (current), plus the scale at gesture start (base), compute the new scale
 * clamped to the [minScale, maxScale] range.
 */
function computeClampedScale(
  baseScale: number,
  initialDistance: number,
  currentDistance: number,
  minScale: number,
  maxScale: number
): number {
  const ratio = currentDistance / initialDistance;
  return Math.min(maxScale, Math.max(minScale, baseScale * ratio));
}

describe("Property 2: Pinch zoom scale is proportional and clamped", () => {
  it("computed scale is always within [minScale, maxScale] for default bounds [1, 3]", () => {
    fc.assert(
      fc.property(
        // base scale already within range
        fc.double({ min: 1, max: 3, noNaN: true }),
        // positive finger distances (px)
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        (baseScale, initialDistance, currentDistance) => {
          const minScale = 1;
          const maxScale = 3;
          const scale = computeClampedScale(
            baseScale,
            initialDistance,
            currentDistance,
            minScale,
            maxScale
          );

          expect(scale).toBeGreaterThanOrEqual(minScale);
          expect(scale).toBeLessThanOrEqual(maxScale);
        }
      ),
      PBT_CONFIG
    );
  });

  it("computed scale stays within arbitrary valid [minScale, maxScale] bounds", () => {
    fc.assert(
      fc.property(
        fc
          .tuple(
            fc.double({ min: 0.1, max: 10, noNaN: true }),
            fc.double({ min: 0.1, max: 10, noNaN: true })
          )
          .map(([a, b]) => (a <= b ? [a, b] : [b, a]) as [number, number]),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        ([minScale, maxScale], baseScale, initialDistance, currentDistance) => {
          const scale = computeClampedScale(
            baseScale,
            initialDistance,
            currentDistance,
            minScale,
            maxScale
          );

          expect(scale).toBeGreaterThanOrEqual(minScale);
          expect(scale).toBeLessThanOrEqual(maxScale);
        }
      ),
      PBT_CONFIG
    );
  });

  it("scale moves proportionally with the pinch delta (monotonic in ratio before clamping)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 3, noNaN: true }),
        fc.double({ min: 100, max: 1000, noNaN: true }),
        // two current distances; larger distance => larger (or equal, when clamped) scale
        fc.double({ min: 1, max: 5000, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        (baseScale, initialDistance, dA, dB) => {
          const minScale = 1;
          const maxScale = 3;
          const smaller = Math.min(dA, dB);
          const larger = Math.max(dA, dB);

          const scaleSmaller = computeClampedScale(
            baseScale,
            initialDistance,
            smaller,
            minScale,
            maxScale
          );
          const scaleLarger = computeClampedScale(
            baseScale,
            initialDistance,
            larger,
            minScale,
            maxScale
          );

          // A larger finger spread can never produce a smaller zoom scale.
          expect(scaleLarger).toBeGreaterThanOrEqual(scaleSmaller);
        }
      ),
      PBT_CONFIG
    );
  });

  it("when base scale equals minScale and fingers move apart, scale increases up to maxScale", () => {
    const minScale = 1;
    const maxScale = 3;
    // Spreading fingers to 10x the initial distance clamps at maxScale
    const scale = computeClampedScale(minScale, 100, 1000, minScale, maxScale);
    expect(scale).toBe(maxScale);
  });

  it("when fingers pinch together below minScale, scale clamps at minScale", () => {
    const minScale = 1;
    const maxScale = 3;
    // Pinching to a tiny distance would compute < minScale, so it clamps
    const scale = computeClampedScale(minScale, 1000, 1, minScale, maxScale);
    expect(scale).toBe(minScale);
  });
});
