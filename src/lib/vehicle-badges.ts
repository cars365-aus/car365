// Shared definitions for vehicle-card trust signals so the badge rules and the
// selectable feature list live in exactly one place (used by the vendor form,
// validation, the data-mapping layer, and the card).

/**
 * Canonical list of vehicle features a vendor can attach to a listing. Kept in
 * sync between the vendor form (checkbox options) and the Zod validation schema.
 */
export const VEHICLE_FEATURES = [
  "Air Conditioning",
  "Bluetooth",
  "Apple CarPlay",
  "Android Auto",
  "GPS Navigation",
  "Reversing Camera",
  "Cruise Control",
  "Sunroof",
  "Child Seat",
  "USB Charging",
  "Heated Seats",
  "All-Wheel Drive",
  "Tinted Windows",
  "Dashcam",
] as const;

export type VehicleFeature = (typeof VEHICLE_FEATURES)[number];

// Thresholds for the auto-derived "Super Host" badge. A host earns it by being
// verified with a strong, well-established review record — never self-assigned.
export const SUPER_HOST_MIN_RATING = 4.8;
export const SUPER_HOST_MIN_REVIEWS = 10;

/**
 * Whether a vendor qualifies for the "Super Host" badge on a listing. Derived
 * purely from data we already have so it can't be gamed by vendor input.
 */
export function computeSuperHost(input: {
  verified?: boolean | null;
  avgRating?: number | null;
  reviewCount?: number | null;
}): boolean {
  return (
    Boolean(input.verified) &&
    (input.avgRating ?? 0) >= SUPER_HOST_MIN_RATING &&
    (input.reviewCount ?? 0) >= SUPER_HOST_MIN_REVIEWS
  );
}
