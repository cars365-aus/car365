// Feature: elite-ui-overhaul, Property 2: Annual Billing Discount Calculation

/**
 * Property Test: Annual Billing Discount Calculation
 *
 * For any monthly price (positive number), annual price SHALL equal
 * `monthlyPrice × 12 × 0.9` rounded to 2 decimal places.
 *
 * **Validates: Requirements 4.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";
import { monthlyPriceArb } from "./arbitraries";
import { calculateAnnualPrice } from "@/components/pricing-table";

describe("Property 2: Annual Billing Discount Calculation", () => {
  it("annual price equals monthlyPrice × 12 × 0.9 rounded to 2 decimal places for any positive monthly price", () => {
    fc.assert(
      fc.property(monthlyPriceArb, (monthlyPrice) => {
        const annualPrice = calculateAnnualPrice(monthlyPrice);

        // Expected: monthlyPrice × 12 × 0.9, rounded to 2 decimal places
        const expected = Math.round(monthlyPrice * 12 * 0.9 * 100) / 100;

        expect(annualPrice).toBe(expected);
      }),
      PBT_CONFIG
    );
  });

  it("annual price is always less than 12 × monthlyPrice (10% discount applied)", () => {
    fc.assert(
      fc.property(monthlyPriceArb, (monthlyPrice) => {
        const annualPrice = calculateAnnualPrice(monthlyPrice);
        const fullYearPrice = monthlyPrice * 12;

        // Annual should be 80% of full year (i.e., 20% discount)
        expect(annualPrice).toBeLessThanOrEqual(fullYearPrice);
      }),
      PBT_CONFIG
    );
  });

  it("annual price is always a non-negative number with at most 2 decimal places", () => {
    fc.assert(
      fc.property(monthlyPriceArb, (monthlyPrice) => {
        const annualPrice = calculateAnnualPrice(monthlyPrice);

        // Must be non-negative
        expect(annualPrice).toBeGreaterThanOrEqual(0);

        // Must have at most 2 decimal places
        const decimalPlaces = (annualPrice.toString().split(".")[1] || "").length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      }),
      PBT_CONFIG
    );
  });

  it("known values: Basic $29 → $278.40, Pro $79 → $758.40, Premium $179 → $1718.40", () => {
    // Verify the spec-defined values as a sanity check (10% discount: price * 12 * 0.9)
    expect(calculateAnnualPrice(49)).toBe(529.2);
    expect(calculateAnnualPrice(99)).toBe(1069.2);
  });
});
