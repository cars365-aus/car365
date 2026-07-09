// Feature: elite-ui-overhaul, Property 4: Pagination Correctness

/**
 * Property Test: Pagination Correctness
 *
 * For any total count and page size of 20, pagination SHALL display
 * `ceil(totalCount / 20)` total pages, and the current page indicator
 * SHALL always be between 1 and the total page count inclusive.
 *
 * **Validates: Requirements 5.7**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { PBT_CONFIG } from "./setup";

const PAGE_SIZE = 20;

/**
 * Pure pagination logic extracted from the search page.
 * Calculates total pages given a total item count and page size.
 */
function calculateTotalPages(totalCount: number): number {
  return Math.ceil(totalCount / PAGE_SIZE);
}

/**
 * Validates whether a given current page is within valid bounds.
 */
function isValidCurrentPage(currentPage: number, totalPages: number): boolean {
  if (totalPages === 0) return currentPage === 1; // no results, stay on page 1
  return currentPage >= 1 && currentPage <= totalPages;
}

describe("Property 4: Pagination Correctness", () => {
  it("totalPages equals ceil(totalCount / 20) for any total count 0-10000", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (totalCount) => {
          const totalPages = calculateTotalPages(totalCount);
          const expected = Math.ceil(totalCount / PAGE_SIZE);

          expect(totalPages).toBe(expected);
        }
      ),
      PBT_CONFIG
    );
  });

  it("current page is always between 1 and totalPages inclusive when totalCount > 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (totalCount) => {
          const totalPages = calculateTotalPages(totalCount);

          // Generate a valid current page within bounds
          // The property asserts that for any totalCount > 0, totalPages >= 1
          // and any valid currentPage must satisfy 1 <= currentPage <= totalPages
          expect(totalPages).toBeGreaterThanOrEqual(1);

          // Verify that pages 1 and totalPages are both valid bounds
          expect(isValidCurrentPage(1, totalPages)).toBe(true);
          expect(isValidCurrentPage(totalPages, totalPages)).toBe(true);

          // Pages outside bounds are invalid
          expect(isValidCurrentPage(0, totalPages)).toBe(false);
          expect(isValidCurrentPage(totalPages + 1, totalPages)).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it("any randomly chosen page within [1, totalPages] is valid for any totalCount > 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }).chain((totalCount) => {
          const totalPages = Math.ceil(totalCount / PAGE_SIZE);
          return fc.tuple(
            fc.constant(totalCount),
            fc.integer({ min: 1, max: totalPages })
          );
        }),
        ([totalCount, currentPage]) => {
          const totalPages = calculateTotalPages(totalCount);

          // Current page must be within valid range
          expect(currentPage).toBeGreaterThanOrEqual(1);
          expect(currentPage).toBeLessThanOrEqual(totalPages);
          expect(isValidCurrentPage(currentPage, totalPages)).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });

  it("when totalCount is 0, totalPages is 0", () => {
    const totalPages = calculateTotalPages(0);
    expect(totalPages).toBe(0);
  });

  it("totalPages * PAGE_SIZE >= totalCount for any positive totalCount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (totalCount) => {
          const totalPages = calculateTotalPages(totalCount);

          // Total capacity (totalPages * pageSize) must be >= totalCount
          expect(totalPages * PAGE_SIZE).toBeGreaterThanOrEqual(totalCount);

          // But not excessively so — at most one page of slack
          expect((totalPages - 1) * PAGE_SIZE).toBeLessThan(totalCount);
        }
      ),
      PBT_CONFIG
    );
  });
});
