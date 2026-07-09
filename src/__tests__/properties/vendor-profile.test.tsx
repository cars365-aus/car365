// Feature: elite-ui-overhaul, Property 5: Vendor Profile Field Completeness

/**
 * Property Test: Vendor Profile Field Completeness
 *
 * For any valid VendorProfile object, rendering the vendor profile header
 * SHALL produce output containing the vendor name, location (city and state),
 * vehicle count, and average rating (when non-null).
 *
 * **Validates: Requirements 6.1**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import React from "react";
import { render } from "@testing-library/react";
import { PBT_CONFIG } from "./setup";
import { vendorProfileArb, type VendorProfile } from "./arbitraries";
import { VendorProfileHeader } from "@/components/vendor-profile-header";

// @vitest-environment jsdom

describe("Property 5: Vendor Profile Field Completeness", () => {
  it("rendered header contains vendor name, city, state, vehicle count, and avg_rating when non-null", () => {
    fc.assert(
      fc.property(vendorProfileArb, (profile: VendorProfile) => {
        const { container } = render(
          <VendorProfileHeader
            name={profile.name}
            verified={profile.is_verified}
            city={profile.city}
            state={profile.state}
            vehicleCount={profile.vehicle_count}
            averageRating={profile.avg_rating}
            reviewCount={profile.review_count}
            description={profile.description}
          />
        );

        const text = container.textContent ?? "";

        // Vendor name must be present
        expect(text).toContain(profile.name);

        // Location: city and state must be present
        expect(text).toContain(profile.city);
        expect(text).toContain(profile.state);

        // Vehicle count must be present as a number
        expect(text).toContain(String(profile.vehicle_count));

        // Rating must be displayed when non-null
        if (profile.avg_rating !== null) {
          expect(text).toContain(profile.avg_rating.toFixed(1));
        }

        // Clean up for next iteration
        container.innerHTML = "";
      }),
      PBT_CONFIG
    );
  });

  it("rendered header omits rating section when avg_rating is null", () => {
    fc.assert(
      fc.property(
        vendorProfileArb.filter((p) => p.avg_rating === null),
        (profile: VendorProfile) => {
          const { container } = render(
            <VendorProfileHeader
              name={profile.name}
              verified={profile.is_verified}
              city={profile.city}
              state={profile.state}
              vehicleCount={profile.vehicle_count}
              averageRating={null}
              reviewCount={profile.review_count}
              description={profile.description}
            />
          );

          // The rating test-id container should not be present
          const ratingEl = container.querySelector('[data-testid="vendor-rating"]');
          expect(ratingEl).toBeNull();

          // Clean up for next iteration
          container.innerHTML = "";
        }
      ),
      PBT_CONFIG
    );
  });

  it("location element contains both city and state in combined format", () => {
    fc.assert(
      fc.property(vendorProfileArb, (profile: VendorProfile) => {
        const { container } = render(
          <VendorProfileHeader
            name={profile.name}
            verified={profile.is_verified}
            city={profile.city}
            state={profile.state}
            vehicleCount={profile.vehicle_count}
            averageRating={profile.avg_rating}
            reviewCount={profile.review_count}
            description={profile.description}
          />
        );

        // The location element should contain "city, state" format
        const locationEl = container.querySelector('[data-testid="vendor-location"]');
        expect(locationEl).not.toBeNull();
        expect(locationEl!.textContent).toContain(`${profile.city}, ${profile.state}`);

        // Clean up for next iteration
        container.innerHTML = "";
      }),
      PBT_CONFIG
    );
  });
});
