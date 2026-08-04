import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_MAX_DROP_PCT, evaluateVolumeGuard, getMaxDropPct } from "./volume-guard";

/**
 * Covers the mandatory volume-guard cases in
 * docs/syndication/failure-modes.md ("Testing requirements").
 *
 * This is the mechanism that stops a transient error from deleting a dealer's
 * entire advertised inventory, so the tests are deliberately exhaustive about
 * the boundary and about what may and may not be overridden.
 */

const ORIGINAL = process.env.FEED_MAX_DROP_PCT;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.FEED_MAX_DROP_PCT;
  else process.env.FEED_MAX_DROP_PCT = ORIGINAL;
});

describe("getMaxDropPct", () => {
  it("defaults to 20%", () => {
    delete process.env.FEED_MAX_DROP_PCT;
    expect(getMaxDropPct()).toBe(DEFAULT_MAX_DROP_PCT);
  });

  it("reads a valid fraction", () => {
    process.env.FEED_MAX_DROP_PCT = "0.05";
    expect(getMaxDropPct()).toBe(0.05);
  });

  it("ignores a value that would disable the guard", () => {
    // "20" meaning 20% would parse as 2000% and let anything through.
    process.env.FEED_MAX_DROP_PCT = "20";
    expect(getMaxDropPct()).toBe(DEFAULT_MAX_DROP_PCT);

    process.env.FEED_MAX_DROP_PCT = "0";
    expect(getMaxDropPct()).toBe(DEFAULT_MAX_DROP_PCT);

    process.env.FEED_MAX_DROP_PCT = "not-a-number";
    expect(getMaxDropPct()).toBe(DEFAULT_MAX_DROP_PCT);
  });
});

describe("volume guard — mandated abort cases", () => {
  it("rejects a feed that drops more than 20% of items", () => {
    const verdict = evaluateVolumeGuard({ currentItemCount: 70, previousItemCount: 100 });
    expect(verdict.publish).toBe(false);
    expect(verdict).toMatchObject({ code: "DROP_EXCEEDED" });
  });

  it("rejects a zero-item feed following a non-zero run", () => {
    const verdict = evaluateVolumeGuard({ currentItemCount: 0, previousItemCount: 38 });
    expect(verdict.publish).toBe(false);
    expect(verdict).toMatchObject({ code: "ZERO_ITEMS" });
  });

  it("aborts when any adapter threw, regardless of counts", () => {
    const verdict = evaluateVolumeGuard({
      currentItemCount: 100,
      previousItemCount: 100,
      adapterThrew: true,
    });
    expect(verdict.publish).toBe(false);
    expect(verdict).toMatchObject({ code: "ADAPTER_THREW" });
  });

  it("aborts when the source query returned partial results", () => {
    const verdict = evaluateVolumeGuard({
      currentItemCount: 100,
      previousItemCount: 100,
      sourceQueryDegraded: true,
    });
    expect(verdict.publish).toBe(false);
    expect(verdict).toMatchObject({ code: "SOURCE_DEGRADED" });
  });
});

describe("volume guard — the boundary", () => {
  it("allows a drop of exactly the threshold", () => {
    // 80 of 100 is exactly 20%: the rule is "more than", not "at least".
    expect(evaluateVolumeGuard({ currentItemCount: 80, previousItemCount: 100 }).publish).toBe(true);
  });

  it("blocks one item past the threshold", () => {
    expect(evaluateVolumeGuard({ currentItemCount: 79, previousItemCount: 100 }).publish).toBe(false);
  });

  it("honours a tightened threshold from the environment", () => {
    process.env.FEED_MAX_DROP_PCT = "0.05";
    expect(evaluateVolumeGuard({ currentItemCount: 90, previousItemCount: 100 }).publish).toBe(false);
  });

  it("never blocks growth", () => {
    expect(evaluateVolumeGuard({ currentItemCount: 500, previousItemCount: 10 }).publish).toBe(true);
  });
});

describe("volume guard — no baseline", () => {
  it("allows a first run, which has nothing to compare against", () => {
    expect(evaluateVolumeGuard({ currentItemCount: 12, previousItemCount: null }).publish).toBe(true);
  });

  it("allows an empty first run — an empty feed deletes nothing that exists", () => {
    expect(evaluateVolumeGuard({ currentItemCount: 0, previousItemCount: null }).publish).toBe(true);
    expect(evaluateVolumeGuard({ currentItemCount: 0, previousItemCount: 0 }).publish).toBe(true);
  });
});

describe("volume guard — overrides", () => {
  it("lets an attributable human override a genuine volume drop", () => {
    const verdict = evaluateVolumeGuard({
      currentItemCount: 10,
      previousItemCount: 100,
      force: true,
      forcedBy: "staff-user-id",
    });
    expect(verdict).toMatchObject({ publish: true, forced: true });
  });

  it("ignores force without an actor — an unattributable override is not one", () => {
    const verdict = evaluateVolumeGuard({
      currentItemCount: 10,
      previousItemCount: 100,
      force: true,
      forcedBy: null,
    });
    expect(verdict.publish).toBe(false);
  });

  it("cannot be forced past a thrown adapter", () => {
    // Forcing here means knowingly publishing a feed known to be incomplete.
    const verdict = evaluateVolumeGuard({
      currentItemCount: 10,
      previousItemCount: 100,
      adapterThrew: true,
      force: true,
      forcedBy: "staff-user-id",
    });
    expect(verdict.publish).toBe(false);
    expect(verdict).toMatchObject({ code: "ADAPTER_THREW" });
  });

  it("cannot be forced past a degraded source query", () => {
    const verdict = evaluateVolumeGuard({
      currentItemCount: 10,
      previousItemCount: 100,
      sourceQueryDegraded: true,
      force: true,
      forcedBy: "staff-user-id",
    });
    expect(verdict.publish).toBe(false);
  });
});

describe("volume guard — staff-facing reasons", () => {
  it("explains what happened, the numbers, and that the old feed still serves", () => {
    const verdict = evaluateVolumeGuard({ currentItemCount: 70, previousItemCount: 100 });
    if (verdict.publish) throw new Error("expected an abort");
    expect(verdict.reason).toContain("70");
    expect(verdict.reason).toContain("100");
    expect(verdict.reason).toContain("30.0%");
    expect(verdict.reason.toLowerCase()).toContain("previous feed is still being served");
  });

  it("is pure — the same input always yields the same verdict", () => {
    const input = { currentItemCount: 70, previousItemCount: 100 };
    expect(evaluateVolumeGuard(input)).toEqual(evaluateVolumeGuard(input));
  });
});
