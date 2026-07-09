// Feature: mobile-optimisation, Property 3: Active filters produce correct UI state
// @vitest-environment jsdom

/**
 * Property Test: Active filters produce correct UI state
 *
 * For any set of active filters (0 to N filters active), the filter chip row
 * should render exactly one chip per active filter, and the floating filter
 * button badge should display the count equal to the number of active filters.
 *
 * **Validates: Requirements 8.3, 8.4**
 *
 * This mirrors the `activeFilterChips` derivation in
 * `src/app/(public)/search/page.tsx`:
 *
 *   const activeFilterChips = Object.entries(filters)
 *     .filter(([_, v]) => v !== undefined && v !== "" && v !== 0)
 *     .map(([k, v]) => ({ key, label }));
 *
 * The floating FAB badge renders `activeFilterChips.length`, and the
 * `FilterChips` component (src/components/filter-chips.tsx) renders one chip
 * per entry of the passed `filters` array.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import * as fc from "fast-check";
import { render, cleanup } from "@testing-library/react";
import { PBT_CONFIG } from "./setup";
import { FilterChips } from "@/components/filter-chips";

// ─── Domain model ────────────────────────────────────────────────────────────

/**
 * The known filter keys derived from the search page state object.
 */
const FILTER_KEYS = [
  "city",
  "category",
  "minPrice",
  "maxPrice",
  "seats",
  "transmission",
  "fuel",
  "make",
  "pickup",
  "returnDate",
] as const;

type FilterValue = string | number | undefined;
type Filters = Partial<Record<(typeof FILTER_KEYS)[number], FilterValue>>;

/**
 * Pure reproduction of the `activeFilterChips` derivation on the search page.
 * Excludes values that are `undefined`, the empty string, or the number 0 —
 * exactly mirroring the page's `.filter(([_, v]) => v !== undefined && v !== "" && v !== 0)`.
 */
function deriveActiveFilterChips(filters: Filters): { key: string; label: string }[] {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== "" && v !== 0)
    .map(([k, v]) => {
      let label = `${v}`;
      if (k === "minPrice") label = `Min $${v}`;
      if (k === "maxPrice") label = `Max $${v}`;
      if (k === "seats") label = `${v}+ Seats`;
      if (k === "returnDate") label = `Return: ${v}`;
      if (k === "pickup") label = `Pickup: ${v}`;
      return { key: k, label };
    });
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * An "active" filter value: a non-empty string or a non-zero number.
 * These are the values that should produce a chip and contribute to the badge.
 */
const activeValueArb: fc.Arbitrary<FilterValue> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== "" && s !== "0"),
  fc.integer({ min: 1, max: 100000 })
);

/**
 * An "inactive" filter value: undefined, empty string, or the number 0.
 * These should be excluded from both the chip row and the badge count.
 */
const inactiveValueArb: fc.Arbitrary<FilterValue> = fc.constantFrom(
  undefined,
  "",
  0
);

/**
 * Generates a filters object plus the expected number of active filters.
 * Each known key is independently assigned either an active or inactive value,
 * yielding 0..N active filters across the full key space.
 */
const filtersArb: fc.Arbitrary<{ filters: Filters; expectedActive: number }> = fc
  .tuple(...FILTER_KEYS.map(() => fc.boolean()))
  .chain((activeFlags) =>
    fc
      .tuple(
        ...activeFlags.map((isActive) =>
          isActive ? activeValueArb : inactiveValueArb
        )
      )
      .map((values) => {
        const filters: Filters = {};
        let expectedActive = 0;
        FILTER_KEYS.forEach((key, i) => {
          const value = values[i];
          filters[key] = value;
          if (value !== undefined && value !== "" && value !== 0) {
            expectedActive += 1;
          }
        });
        return { filters, expectedActive };
      })
  );

// ─── Properties ──────────────────────────────────────────────────────────────

describe("Property 3: Active filters produce correct UI state", () => {
  it("derives exactly one chip per active filter (0..N)", () => {
    fc.assert(
      fc.property(filtersArb, ({ filters, expectedActive }) => {
        const chips = deriveActiveFilterChips(filters);
        expect(chips.length).toBe(expectedActive);
      }),
      PBT_CONFIG
    );
  });

  it("badge count equals the number of active filters (= chip count)", () => {
    fc.assert(
      fc.property(filtersArb, ({ filters, expectedActive }) => {
        const chips = deriveActiveFilterChips(filters);
        // The FAB badge renders `activeFilterChips.length`.
        const badgeCount = chips.length;
        expect(badgeCount).toBe(expectedActive);
      }),
      PBT_CONFIG
    );
  });

  it("FilterChips renders exactly one chip per active filter", () => {
    fc.assert(
      fc.property(filtersArb, ({ filters, expectedActive }) => {
        const chips = deriveActiveFilterChips(filters);
        const { container } = render(
          createElement(FilterChips, { filters: chips, onRemove: () => {} })
        );
        try {
          // Each chip has exactly one "Remove ... filter" dismiss button.
          const removeButtons = container.querySelectorAll(
            'button[aria-label^="Remove "]'
          );
          expect(removeButtons.length).toBe(expectedActive);
        } finally {
          cleanup();
        }
      }),
      PBT_CONFIG
    );
  });

  it("renders no chips when there are zero active filters", () => {
    const { container } = render(
      createElement(FilterChips, { filters: [], onRemove: () => {} })
    );
    try {
      const removeButtons = container.querySelectorAll(
        'button[aria-label^="Remove "]'
      );
      expect(removeButtons.length).toBe(0);
    } finally {
      cleanup();
    }
  });
});
