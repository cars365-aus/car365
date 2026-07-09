import { describe, it, expect } from "vitest";
import { computeSuperHost, SUPER_HOST_MIN_RATING, SUPER_HOST_MIN_REVIEWS } from "./vehicle-badges";

describe("computeSuperHost", () => {
  it("awards the badge when verified, rating and review count all meet the thresholds", () => {
    expect(computeSuperHost({ verified: true, avgRating: SUPER_HOST_MIN_RATING, reviewCount: SUPER_HOST_MIN_REVIEWS })).toBe(true);
    expect(computeSuperHost({ verified: true, avgRating: 5, reviewCount: 42 })).toBe(true);
  });

  it("denies the badge when the host is not verified, regardless of ratings", () => {
    expect(computeSuperHost({ verified: false, avgRating: 5, reviewCount: 100 })).toBe(false);
  });

  it("denies the badge just below the rating threshold", () => {
    expect(computeSuperHost({ verified: true, avgRating: 4.7, reviewCount: 50 })).toBe(false);
  });

  it("denies the badge just below the review-count threshold", () => {
    expect(computeSuperHost({ verified: true, avgRating: 5, reviewCount: SUPER_HOST_MIN_REVIEWS - 1 })).toBe(false);
  });

  it("treats null/undefined rating and count as zero", () => {
    expect(computeSuperHost({ verified: true, avgRating: null, reviewCount: null })).toBe(false);
    expect(computeSuperHost({ verified: true })).toBe(false);
  });
});
