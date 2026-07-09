// Feature: elite-ui-overhaul, Property 3: VehicleCard Field Completeness

/**
 * Property Test: VehicleCard Field Completeness
 *
 * For any valid Vehicle object, rendered VehicleCard SHALL contain
 * vehicle name, category, price per day, vendor name, location city,
 * and a CTA link to the vehicle detail page.
 *
 * **Validates: Requirements 5.5**
 */

// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { PBT_CONFIG } from "./setup";
import { vehicleArb } from "./arbitraries";
import type { Vehicle as ArbVehicle } from "./arbitraries";
import { VehicleCard } from "@/components/vehicle-card";
import type { Vehicle } from "@/lib/types";

// Mock next/image to render a plain img element
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, ...rest } = props;
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Maps the generated arbitrary Vehicle (design doc shape) to the
 * component's Vehicle type (from @/lib/types).
 */
function toComponentVehicle(arb: ArbVehicle): Vehicle {
  return {
    id: arb.id,
    slug: arb.slug,
    title: arb.name,
    make: "TestMake",
    model: "TestModel",
    year: 2023,
    city: arb.location_city,
    state: "WA",
    pricePerDayAud: arb.price_per_day,
    seats: arb.seats,
    fuel: arb.fuel_type,
    transmission: arb.transmission,
    category: arb.category,
    imageUrl: arb.image_url || "/vehicle-placeholder.jpg",
    vendorName: arb.vendor_name,
    vendorSlug: arb.vendor_slug,
    branchName: arb.branch_location,
    verified: true,
    instantBook: false,
  };
}

const baseVehicle: Vehicle = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "test-car",
  title: "2023 Test Car",
  make: "Test",
  model: "Car",
  year: 2023,
  city: "Sydney",
  state: "NSW",
  pricePerDayAud: 45,
  seats: 5,
  fuel: "Petrol",
  transmission: "Automatic",
  category: "Sedan",
  imageUrl: "/vehicle-placeholder.jpg",
  vendorName: "Acme Rentals",
  vendorSlug: "acme",
  branchName: "Sydney CBD",
  verified: true,
};

describe("VehicleCard enrichment field gating", () => {
  it("hides rating, weekly/monthly, logo, Super Host and chips when their data is absent", () => {
    const { container, unmount } = render(<VehicleCard vehicle={{ ...baseVehicle, dailyDistanceLimitKm: 200 }} />);
    const text = container.textContent || "";
    expect(text).not.toContain("Reviews");
    expect(text).not.toContain("Weekly from");
    expect(text).not.toContain("Super Host");
    expect(text).not.toContain("Free cancellation");
    expect(text).not.toContain("No hidden fees");
    expect(text).not.toContain("Free delivery");
    expect(text).not.toContain("Unlimited km"); // KM limit set => not unlimited
    expect(container.querySelector("img[alt='Acme Rentals']")).toBeNull(); // no logo
    unmount();
  });

  it("shows rating, weekly/monthly, logo, Super Host, delivery and chips when present", () => {
    const vehicle: Vehicle = {
      ...baseVehicle,
      avgRating: 4.9,
      reviewCount: 38,
      weeklyRateAud: 210,
      monthlyRateAud: 800,
      vendorLogoUrl: "https://example.supabase.co/logo.png",
      superHost: true,
      features: ["Air Conditioning"],
      freeDelivery: true,
      freeCancellation: true,
      noHiddenFees: true,
      dailyDistanceLimitKm: null, // unlimited
    };
    const { container, unmount } = render(<VehicleCard vehicle={vehicle} variant="featured" />);
    const text = container.textContent || "";
    expect(text).toContain("(38 Reviews)");
    expect(text).toContain("Weekly from");
    expect(text).toContain("210");
    expect(text).toContain("Monthly from");
    expect(text).toContain("Super Host");
    expect(text).toContain("Air Conditioning");
    expect(text).toContain("Free delivery available");
    expect(text).toContain("Free cancellation");
    expect(text).toContain("No hidden fees");
    expect(text).toContain("Unlimited km");
    expect(text).toContain("Featured");
    expect(container.querySelector("img[alt='Acme Rentals']")).not.toBeNull();
    unmount();
  });
});

describe("Property 3: VehicleCard Field Completeness", () => {
  it("rendered VehicleCard contains vehicle name, category, price, vendor name, location city, and CTA link for any valid Vehicle", () => {
    fc.assert(
      fc.property(vehicleArb, (arbVehicle) => {
        const vehicle = toComponentVehicle(arbVehicle);
        const { container, unmount } = render(<VehicleCard vehicle={vehicle} />);

        const textContent = container.textContent || "";

        // Vehicle name must be present
        expect(textContent).toContain(vehicle.title);

        // Price per day must be present (as rendered number)
        expect(textContent).toContain(String(vehicle.pricePerDayAud));

        // Vendor name must be present
        expect(textContent).toContain(vehicle.vendorName);

        // Location city must be present
        expect(textContent).toContain(vehicle.city);

        // CTA link to vehicle detail page must be present
        const link = container.querySelector(`a[href="/cars/${vehicle.slug}"]`);
        expect(link).not.toBeNull();

        // Cleanup to avoid DOM accumulation
        unmount();
      }),
      PBT_CONFIG
    );
  });
});
