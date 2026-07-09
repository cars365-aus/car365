/**
 * Shared Arbitraries for Property-Based Tests
 * Feature: elite-ui-overhaul
 *
 * Provides reusable generators (arbitraries) for the core data types
 * consumed by UI components throughout the platform.
 */

import * as fc from "fast-check";

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category: string;
  price_per_day: number;
  image_url: string | null;
  vendor_name: string;
  vendor_slug: string;
  location_city: string;
  seats: number;
  fuel_type: string;
  transmission: string;
  branch_location: string;
}

const VEHICLE_CATEGORIES = [
  "sedan",
  "suv",
  "hatchback",
  "ute",
  "van",
  "luxury",
  "convertible",
  "wagon",
];

const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid"];

const TRANSMISSIONS = ["automatic", "manual"];

const AUSTRALIAN_CITIES = [
  "Perth",
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Adelaide",
  "Darwin",
  "Hobart",
  "Canberra",
];

/**
 * Generates a valid Vehicle object with realistic constraints:
 * - Non-empty name, slug, vendor_name, vendor_slug, location_city, branch_location
 * - price_per_day is a positive number (1-5000 AUD)
 * - seats between 2 and 12
 * - image_url is either a valid URL string or null
 */
export const vehicleArb: fc.Arbitrary<Vehicle> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  slug: fc
    .string({ minLength: 1, maxLength: 60 })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60) || "vehicle"),
  category: fc.constantFrom(...VEHICLE_CATEGORIES),
  price_per_day: fc.integer({ min: 1, max: 5000 }),
  image_url: fc.oneof(
    fc.constant(null),
    fc.webUrl().map((url) => url)
  ),
  vendor_name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  vendor_slug: fc
    .string({ minLength: 1, maxLength: 60 })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60) || "vendor"),
  location_city: fc.constantFrom(...AUSTRALIAN_CITIES),
  seats: fc.integer({ min: 2, max: 12 }),
  fuel_type: fc.constantFrom(...FUEL_TYPES),
  transmission: fc.constantFrom(...TRANSMISSIONS),
  branch_location: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
});

// ─── VendorProfile ───────────────────────────────────────────────────────────

export interface VendorProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified: boolean;
  city: string;
  state: string;
  vehicle_count: number;
  avg_rating: number | null;
  review_count: number;
  description: string | null;
}

const AUSTRALIAN_STATES = ["WA", "NSW", "VIC", "QLD", "SA", "NT", "TAS", "ACT"];

/**
 * Generates a valid VendorProfile object with realistic constraints:
 * - Non-empty name, slug, city, state
 * - vehicle_count >= 0
 * - avg_rating is null or between 1.0 and 5.0 (one decimal place)
 * - review_count >= 0
 * - description is null or a non-empty string (up to 2000 chars)
 */
export const vendorProfileArb: fc.Arbitrary<VendorProfile> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  slug: fc
    .string({ minLength: 1, maxLength: 60 })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60) || "vendor"),
  logo_url: fc.oneof(
    fc.constant(null),
    fc.webUrl().map((url) => url)
  ),
  is_verified: fc.boolean(),
  city: fc.constantFrom(...AUSTRALIAN_CITIES),
  state: fc.constantFrom(...AUSTRALIAN_STATES),
  vehicle_count: fc.integer({ min: 0, max: 500 }),
  avg_rating: fc.oneof(
    fc.constant(null),
    fc.integer({ min: 10, max: 50 }).map((n) => n / 10) // 1.0 to 5.0
  ),
  review_count: fc.integer({ min: 0, max: 10000 }),
  description: fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0)
  ),
});

// ─── PricingPlan ─────────────────────────────────────────────────────────────

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  id: "basic" | "pro" | "premium";
  name: string;
  monthlyPrice: number;
  vehicleLimit: number | null;
  features: PlanFeature[];
  badge?: string;
}

const PLAN_IDS = ["basic", "pro", "premium"] as const;

const PLAN_NAMES: Record<(typeof PLAN_IDS)[number], string> = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

const FEATURE_LABELS = [
  "Vehicle listings",
  "Vendor profile page",
  "Inquiry form leads",
  "Email lead notifications",
  "WhatsApp click button",
  "Phone click tracking",
  "Analytics dashboard",
  "Featured placement",
  "AI SEO content",
  "GPS Verified badge",
  "Priority support",
];

/**
 * Generates a valid PlanFeature object.
 */
export const planFeatureArb: fc.Arbitrary<PlanFeature> = fc.record({
  label: fc.constantFrom(...FEATURE_LABELS),
  included: fc.boolean(),
});

/**
 * Generates a valid PricingPlan object with realistic constraints:
 * - id is one of "basic", "pro", "premium"
 * - monthlyPrice is a positive integer (1-1000 AUD)
 * - vehicleLimit is null (unlimited) or a positive integer (1-100)
 * - features is an array of 1-15 PlanFeature objects
 * - badge is optional
 */
export const pricingPlanArb: fc.Arbitrary<PricingPlan> = fc
  .constantFrom(...PLAN_IDS)
  .chain((id) =>
    fc.record({
      id: fc.constant(id),
      name: fc.constant(PLAN_NAMES[id]),
      monthlyPrice: fc.integer({ min: 1, max: 1000 }),
      vehicleLimit: fc.oneof(
        fc.constant(null),
        fc.integer({ min: 1, max: 100 })
      ),
      features: fc.array(planFeatureArb, { minLength: 1, maxLength: 15 }),
      badge: fc.oneof(
        fc.constant(undefined),
        fc.constant("Most Popular - Best Value")
      ),
    })
  );

/**
 * Generates a positive monthly price for discount calculation tests.
 * Covers a range from small amounts to realistic SaaS pricing.
 */
export const monthlyPriceArb: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: 1, max: 10000 }), // Integer prices
  fc.double({ min: 0.01, max: 10000, noNaN: true }).map((n) =>
    Math.round(n * 100) / 100
  ) // Decimal prices rounded to cents
);
