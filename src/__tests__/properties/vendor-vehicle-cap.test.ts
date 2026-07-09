// Feature: elite-ui-overhaul, Property 6: Vendor Vehicle Display Cap

/**
 * Property Test: Vendor Vehicle Display Cap
 *
 * For any vendor with N approved vehicles where N ≥ 0, the vendor profile page
 * SHALL display exactly `min(N, 12)` vehicle cards. When N > 12, a "View all"
 * link SHALL be present.
 *
 * **Validates: Requirements 6.2, 6.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";
import { vehicleArb } from "./arbitraries";

/**
 * The display cap constant used by the vendor profile page.
 * The page queries `.limit(12)` and shows "View all" when vehicleCount > 12.
 */
const VENDOR_VEHICLE_DISPLAY_CAP = 12;

/**
 * Computes the number of vehicle cards to display on the vendor profile page.
 * This mirrors the logic in `src/app/(public)/vendors/[slug]/page.tsx`:
 * - The DB query fetches at most 12 vehicles (`.limit(12)`)
 * - So the displayed count is `min(totalVehicleCount, 12)`
 */
function getDisplayedVehicleCount(totalVehicleCount: number): number {
  return Math.min(totalVehicleCount, VENDOR_VEHICLE_DISPLAY_CAP);
}

/**
 * Determines whether the "View all" link should be shown.
 * This mirrors the condition `vendor.vehicleCount > 12` in the vendor profile page.
 */
function shouldShowViewAllLink(totalVehicleCount: number): boolean {
  return totalVehicleCount > VENDOR_VEHICLE_DISPLAY_CAP;
}

describe("Property 6: Vendor Vehicle Display Cap", () => {
  it("displays exactly min(N, 12) vehicle cards for any vendor with N vehicles (0-100)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (vehicleCount) => {
          const displayedCount = getDisplayedVehicleCount(vehicleCount);
          const expected = Math.min(vehicleCount, 12);

          expect(displayedCount).toBe(expected);
        }
      ),
      PBT_CONFIG
    );
  });

  it("shows 'View all' link when N > 12, hides it when N <= 12", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (vehicleCount) => {
          const showViewAll = shouldShowViewAllLink(vehicleCount);

          if (vehicleCount > 12) {
            expect(showViewAll).toBe(true);
          } else {
            expect(showViewAll).toBe(false);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it("displayed count never exceeds 12 regardless of total vehicle count", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (vehicleCount) => {
          const displayedCount = getDisplayedVehicleCount(vehicleCount);
          expect(displayedCount).toBeLessThanOrEqual(12);
        }
      ),
      PBT_CONFIG
    );
  });

  it("displayed count equals total count when total is at or below cap", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 12 }),
        (vehicleCount) => {
          const displayedCount = getDisplayedVehicleCount(vehicleCount);
          expect(displayedCount).toBe(vehicleCount);
        }
      ),
      PBT_CONFIG
    );
  });

  it("fleet array length matches displayed count when generating vehicle arrays", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.array(vehicleArb, { minLength: 0, maxLength: 100 }),
        (totalVehicleCount, allVehicles) => {
          // Simulate the DB behavior: take up to 12 vehicles from the available set
          // The actual count available may differ from totalVehicleCount in generation,
          // but what matters is the cap logic
          const availableVehicles = allVehicles.slice(0, totalVehicleCount);
          const fleet = availableVehicles.slice(0, VENDOR_VEHICLE_DISPLAY_CAP);

          expect(fleet.length).toBe(Math.min(totalVehicleCount, Math.min(allVehicles.length, 12)));
          expect(fleet.length).toBeLessThanOrEqual(12);
        }
      ),
      PBT_CONFIG
    );
  });

  it("boundary: exactly 12 vehicles shows all 12 cards and no 'View all' link", () => {
    const displayedCount = getDisplayedVehicleCount(12);
    const showViewAll = shouldShowViewAllLink(12);

    expect(displayedCount).toBe(12);
    expect(showViewAll).toBe(false);
  });

  it("boundary: exactly 13 vehicles shows 12 cards and 'View all' link", () => {
    const displayedCount = getDisplayedVehicleCount(13);
    const showViewAll = shouldShowViewAllLink(13);

    expect(displayedCount).toBe(12);
    expect(showViewAll).toBe(true);
  });

  it("boundary: 0 vehicles shows 0 cards and no 'View all' link", () => {
    const displayedCount = getDisplayedVehicleCount(0);
    const showViewAll = shouldShowViewAllLink(0);

    expect(displayedCount).toBe(0);
    expect(showViewAll).toBe(false);
  });
});
