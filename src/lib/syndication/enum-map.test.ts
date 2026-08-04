import { describe, it, expect } from "vitest";
import { buildEnumMap, findUnmappedValues, mapEnum, CANONICAL_ENUM_VALUES } from "./enum-map";

/**
 * The single rule under test: an unmapped value REJECTS. It never defaults,
 * never guesses, never falls back. Defaulting an unknown body type to "Sedan"
 * publishes a factually wrong advertisement (failure-modes.md F6).
 */

const GOOGLE = buildEnumMap([
  { canonicalField: "body_type", canonicalValue: "ute", channelValue: "Pickup" },
  { canonicalField: "body_type", canonicalValue: "suv", channelValue: "SUV" },
  { canonicalField: "fuel_type", canonicalValue: "diesel", channelValue: "Diesel" },
]);

const OPTS = { channelName: "Google Vehicle Ads" };

describe("mapEnum", () => {
  it("translates a mapped value", () => {
    expect(mapEnum(GOOGLE, "body_type", "ute", OPTS)).toEqual({ ok: true, value: "Pickup" });
  });

  it("REJECTS an unmapped value rather than defaulting", () => {
    const result = mapEnum(GOOGLE, "body_type", "convertible", OPTS);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejection.code).toBe("UNMAPPED_ENUM");
  });

  it("names the exact unmapped value, so staff know what to add", () => {
    const result = mapEnum(GOOGLE, "body_type", "convertible", OPTS);
    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejection.message).toContain("convertible");
    expect(result.rejection.message).toContain("Google Vehicle Ads");
    expect(result.rejection.fixHint).toContain("convertible");
  });

  it("does not leak snake_case field names into staff-facing copy", () => {
    const result = mapEnum(GOOGLE, "body_type", "convertible", OPTS);
    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejection.message).not.toContain("body_type");
    expect(result.rejection.message).toContain("body type");
  });

  it("rejects a missing value when the field is required", () => {
    for (const empty of [null, undefined, ""]) {
      const result = mapEnum(GOOGLE, "fuel_type", empty, OPTS);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.rejection.code).toBe("MISSING_ENUM_VALUE");
    }
  });

  it("allows a missing value when the field is explicitly optional", () => {
    expect(mapEnum(GOOGLE, "drivetrain", null, { ...OPTS, required: false })).toEqual({ ok: true, value: "" });
  });

  it("is case-sensitive — canonical values are enum literals, not free text", () => {
    expect(mapEnum(GOOGLE, "body_type", "UTE", OPTS).ok).toBe(false);
  });

  it("keeps fields isolated — a value mapped for one field does not satisfy another", () => {
    expect(mapEnum(GOOGLE, "fuel_type", "ute", OPTS).ok).toBe(false);
  });
});

describe("findUnmappedValues", () => {
  it("reports gaps across the FULL schema enum, not just values in live data", () => {
    // Live data today has only petrol and diesel, but the schema allows six
    // fuels. The first electric car listed must not be what discovers the gap.
    const gaps = findUnmappedValues(GOOGLE, ["fuel_type"]);
    expect(gaps.map((g) => g.value).sort()).toEqual(["electric", "hybrid", "lpg", "petrol", "phev"]);
  });

  it("returns nothing when a field is fully covered", () => {
    const complete = buildEnumMap(
      CANONICAL_ENUM_VALUES.transmission.map((v) => ({
        canonicalField: "transmission",
        canonicalValue: v,
        channelValue: v.toUpperCase(),
      })),
    );
    expect(findUnmappedValues(complete, ["transmission"])).toEqual([]);
  });

  it("checks every canonical field by default", () => {
    const gaps = findUnmappedValues(buildEnumMap([]));
    const expected = Object.values(CANONICAL_ENUM_VALUES).reduce((n, vs) => n + vs.length, 0);
    expect(gaps).toHaveLength(expected);
  });
});

describe("buildEnumMap", () => {
  it("lets a later row win, so a corrected mapping overrides an earlier one", () => {
    const map = buildEnumMap([
      { canonicalField: "body_type", canonicalValue: "ute", channelValue: "Truck" },
      { canonicalField: "body_type", canonicalValue: "ute", channelValue: "Pickup" },
    ]);
    expect(mapEnum(map, "body_type", "ute", OPTS)).toEqual({ ok: true, value: "Pickup" });
  });

  it("handles an empty mapping set without throwing", () => {
    expect(mapEnum(buildEnumMap([]), "body_type", "suv", OPTS).ok).toBe(false);
  });
});
