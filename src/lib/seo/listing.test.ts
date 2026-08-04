import { describe, it, expect } from "vitest";
import { currentPage, hasActiveFacets, listingIndexation, paginatedTitle } from "./listing";
import { canonical, absoluteUrl } from "./site";

/**
 * These rules decide whether Google indexes a URL, so a regression here is
 * invisible in the UI and expensive in the SERPs. The behaviour under test is
 * the fix for two live bugs: every page canonicalising to the homepage, and
 * every filter permutation being independently indexable.
 */

const HUB = "/used-cars";

describe("hasActiveFacets", () => {
  it("is false for a clean hub and for pagination alone", () => {
    expect(hasActiveFacets({})).toBe(false);
    expect(hasActiveFacets({ page: "2" })).toBe(false);
  });

  it("is true for any filter or sort", () => {
    expect(hasActiveFacets({ fuel: "diesel" })).toBe(true);
    expect(hasActiveFacets({ sort: "price_asc" })).toBe(true);
    expect(hasActiveFacets({ q: "hilux" })).toBe(true);
    expect(hasActiveFacets({ price_max: "20000" })).toBe(true);
  });

  it("ignores empty and unknown params", () => {
    expect(hasActiveFacets({ fuel: "" })).toBe(false);
    expect(hasActiveFacets({ utm_source: "google" })).toBe(false);
  });
});

describe("currentPage", () => {
  it("defaults to 1 and rejects junk", () => {
    expect(currentPage({})).toBe(1);
    expect(currentPage({ page: "abc" })).toBe(1);
    expect(currentPage({ page: "0" })).toBe(1);
    expect(currentPage({ page: "-3" })).toBe(1);
  });

  it("reads a valid page number", () => {
    expect(currentPage({ page: "4" })).toBe(4);
  });
});

describe("listingIndexation", () => {
  it("makes the clean hub indexable and self-canonical", () => {
    const meta = listingIndexation(HUB, {});
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates).toEqual(canonical(HUB));
  });

  it("holds filtered URLs out of the index but keeps them crawlable", () => {
    const meta = listingIndexation(HUB, { fuel: "diesel", sort: "price_asc" });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
    // …and points them at the hub so its signals consolidate there.
    expect(meta.alternates).toEqual(canonical(HUB));
  });

  it("gives paginated pages a SELF-referencing canonical, not page 1", () => {
    const meta = listingIndexation(HUB, { page: "3" });
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/used-cars?page=3"));
  });

  it("drops ?page=1, which is a duplicate of the hub", () => {
    expect(listingIndexation(HUB, { page: "1" }).alternates?.canonical).toBe(absoluteUrl(HUB));
  });

  it("treats a filtered deep page as filtered, not as pagination", () => {
    const meta = listingIndexation(HUB, { fuel: "diesel", page: "2" });
    expect(meta.robots).toMatchObject({ index: false });
    expect(meta.alternates?.canonical).toBe(absoluteUrl(HUB));
  });

  it("never emits a query string in an indexable canonical other than page", () => {
    const meta = listingIndexation(HUB, { make: "toyota", page: "2" });
    expect(meta.alternates?.canonical).not.toContain("make=");
  });
});

describe("paginatedTitle", () => {
  it("leaves page 1 alone and labels deeper pages", () => {
    expect(paginatedTitle("Used Cars", {})).toBe("Used Cars");
    expect(paginatedTitle("Used Cars", { page: "1" })).toBe("Used Cars");
    expect(paginatedTitle("Used Cars", { page: "2" })).toBe("Used Cars - Page 2");
  });
});
