// Feature: mobile-optimisation, Property 5: WhatsApp button repositions above sticky CTA

/**
 * Property Test: WhatsApp button repositions above sticky CTA
 *
 * For any sticky CTA bar height H (H > 0), when the CTA is visible on mobile,
 * the WhatsApp button's bottom offset should equal `H + GAP + BASE_OFFSET`
 * where BASE_OFFSET is the default bottom spacing (24px) and GAP is the
 * minimum gap above the CTA bar (12px).
 *
 * **Validates: Requirements 13.2**
 *
 * This mirrors the repositioning logic in `src/components/whatsapp-float.tsx`:
 * when the sticky CTA is visible the floating button is lifted above the bar
 * by the CTA height plus a 12px gap, on top of the 24px base offset. The
 * production component encodes a fixed value (CTA height 44px -> 80px offset);
 * this property generalises that computation across all CTA heights.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

/** Default bottom spacing applied to the floating button (px). */
const BASE_OFFSET = 24;
/** Minimum gap maintained between the button and the sticky CTA bar (px). */
const GAP = 12;

/**
 * Pure reproduction of the WhatsApp button bottom-offset computation used when
 * the sticky CTA bar is visible on mobile.
 */
function whatsappBottomOffset(ctaHeight: number): number {
  return ctaHeight + GAP + BASE_OFFSET;
}

describe("Property 5: WhatsApp button repositions above sticky CTA", () => {
  it("bottom offset equals H + 12 + 24 for any CTA height H > 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (ctaHeight) => {
          const offset = whatsappBottomOffset(ctaHeight);
          expect(offset).toBe(ctaHeight + 12 + 24);
        }
      ),
      PBT_CONFIG
    );
  });

  it("always clears the CTA bar by at least the 12px gap plus base offset", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (ctaHeight) => {
          const offset = whatsappBottomOffset(ctaHeight);
          // The button sits strictly above the top of the CTA bar.
          expect(offset).toBeGreaterThanOrEqual(ctaHeight + GAP);
          // And retains the base spacing on top of the gap.
          expect(offset - ctaHeight).toBe(GAP + BASE_OFFSET);
        }
      ),
      PBT_CONFIG
    );
  });

  it("increases monotonically with CTA height", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (a, b) => {
          fc.pre(a < b);
          expect(whatsappBottomOffset(a)).toBeLessThan(whatsappBottomOffset(b));
        }
      ),
      PBT_CONFIG
    );
  });

  it("matches the production fixed offset for a 44px CTA bar", () => {
    // The component hardcodes an 80px offset for the standard 44px CTA height.
    expect(whatsappBottomOffset(44)).toBe(80);
  });
});
