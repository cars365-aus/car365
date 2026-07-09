/**
 * Smoke test for shared arbitraries
 * Feature: elite-ui-overhaul
 *
 * Validates that all shared arbitraries generate valid objects
 * matching the expected interfaces.
 */

import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";
import {
  vehicleArb,
  vendorProfileArb,
  pricingPlanArb,
  monthlyPriceArb,
  planFeatureArb,
} from "./arbitraries";
import type { Vehicle, VendorProfile, PricingPlan, PlanFeature } from "./arbitraries";

describe("Shared Arbitraries Validation", () => {
  // Feature: elite-ui-overhaul, Setup: Arbitrary generation smoke tests

  it("vehicleArb generates valid Vehicle objects", () => {
    fc.assert(
      fc.property(vehicleArb, (vehicle: Vehicle) => {
        expect(vehicle.id).toBeTruthy();
        expect(vehicle.name.trim().length).toBeGreaterThan(0);
        expect(vehicle.slug.length).toBeGreaterThan(0);
        expect(vehicle.category).toBeTruthy();
        expect(vehicle.price_per_day).toBeGreaterThan(0);
        expect(vehicle.vendor_name.trim().length).toBeGreaterThan(0);
        expect(vehicle.vendor_slug.length).toBeGreaterThan(0);
        expect(vehicle.location_city).toBeTruthy();
        expect(vehicle.seats).toBeGreaterThanOrEqual(2);
        expect(vehicle.seats).toBeLessThanOrEqual(12);
        expect(vehicle.fuel_type).toBeTruthy();
        expect(vehicle.transmission).toBeTruthy();
        expect(vehicle.branch_location.trim().length).toBeGreaterThan(0);
        // image_url is either null or a string
        expect(vehicle.image_url === null || typeof vehicle.image_url === "string").toBe(true);
      }),
      PBT_CONFIG
    );
  });

  it("vendorProfileArb generates valid VendorProfile objects", () => {
    fc.assert(
      fc.property(vendorProfileArb, (profile: VendorProfile) => {
        expect(profile.id).toBeTruthy();
        expect(profile.name.trim().length).toBeGreaterThan(0);
        expect(profile.slug.length).toBeGreaterThan(0);
        expect(typeof profile.is_verified).toBe("boolean");
        expect(profile.city).toBeTruthy();
        expect(profile.state).toBeTruthy();
        expect(profile.vehicle_count).toBeGreaterThanOrEqual(0);
        expect(profile.review_count).toBeGreaterThanOrEqual(0);
        // avg_rating is null or between 1.0 and 5.0
        if (profile.avg_rating !== null) {
          expect(profile.avg_rating).toBeGreaterThanOrEqual(1.0);
          expect(profile.avg_rating).toBeLessThanOrEqual(5.0);
        }
        // description is null or non-empty
        if (profile.description !== null) {
          expect(profile.description.trim().length).toBeGreaterThan(0);
        }
        // logo_url is null or a string
        expect(profile.logo_url === null || typeof profile.logo_url === "string").toBe(true);
      }),
      PBT_CONFIG
    );
  });

  it("pricingPlanArb generates valid PricingPlan objects", () => {
    fc.assert(
      fc.property(pricingPlanArb, (plan: PricingPlan) => {
        expect(["basic", "pro", "premium"]).toContain(plan.id);
        expect(plan.name).toBeTruthy();
        expect(plan.monthlyPrice).toBeGreaterThan(0);
        // vehicleLimit is null or positive
        if (plan.vehicleLimit !== null) {
          expect(plan.vehicleLimit).toBeGreaterThan(0);
        }
        expect(plan.features.length).toBeGreaterThanOrEqual(1);
        plan.features.forEach((f: PlanFeature) => {
          expect(f.label).toBeTruthy();
          expect(typeof f.included).toBe("boolean");
        });
        // badge is undefined or a string
        if (plan.badge !== undefined) {
          expect(typeof plan.badge).toBe("string");
        }
      }),
      PBT_CONFIG
    );
  });

  it("monthlyPriceArb generates positive prices", () => {
    fc.assert(
      fc.property(monthlyPriceArb, (price: number) => {
        expect(price).toBeGreaterThan(0);
        expect(price).toBeLessThanOrEqual(10000);
        // Verify it's rounded to at most 2 decimal places
        const rounded = Math.round(price * 100) / 100;
        expect(price).toBeCloseTo(rounded, 2);
      }),
      PBT_CONFIG
    );
  });

  it("planFeatureArb generates valid PlanFeature objects", () => {
    fc.assert(
      fc.property(planFeatureArb, (feature: PlanFeature) => {
        expect(feature.label).toBeTruthy();
        expect(typeof feature.included).toBe("boolean");
      }),
      PBT_CONFIG
    );
  });
});
