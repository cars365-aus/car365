import { describe, it, expect } from "vitest";
import { isIndexableLanding, thinPageRobots, THIN_PAGE_THRESHOLDS } from "./guards";

/**
 * Thin programmatic landing pages are a site-wide demotion risk, so the guard
 * that keeps them out of the index needs to hold at its boundaries.
 */
describe("thin-page guards", () => {
  it("keeps an empty landing page out of the index but crawlable", () => {
    const robots = thinPageRobots(0, "makeModel");
    expect(robots).toMatchObject({ index: false, follow: true });
    expect(robots?.googleBot).toMatchObject({ index: false, follow: true });
  });

  it("returns undefined once a page is fat enough, so the caller keeps its own robots", () => {
    expect(thinPageRobots(THIN_PAGE_THRESHOLDS.makeModel, "makeModel")).toBeUndefined();
    expect(thinPageRobots(THIN_PAGE_THRESHOLDS.category, "category")).toBeUndefined();
  });

  it("holds exactly at the threshold boundary", () => {
    const { makeModel } = THIN_PAGE_THRESHOLDS;
    expect(isIndexableLanding(makeModel - 1, "makeModel")).toBe(false);
    expect(isIndexableLanding(makeModel, "makeModel")).toBe(true);

    const { category } = THIN_PAGE_THRESHOLDS;
    expect(isIndexableLanding(category - 1, "category")).toBe(false);
    expect(isIndexableLanding(category, "category")).toBe(true);
  });

  it("applies a stricter bar to broad category hubs than to model hubs", () => {
    expect(THIN_PAGE_THRESHOLDS.category).toBeGreaterThan(THIN_PAGE_THRESHOLDS.makeModel);
  });
});
