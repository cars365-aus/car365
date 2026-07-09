import { describe, expect, it } from "vitest";

import {
  type BusinessHours,
  describeNextOpen,
  selectReplyVariant,
  WEEKDAYS,
} from "./business-hours";

/**
 * Build a BusinessHours config open 09:00-17:00 on every weekday in the given
 * timezone, with optional overrides for specific days (use `null` to close).
 */
function makeHours(
  timezone: string,
  overrides: Partial<BusinessHours["days"]> = {},
): BusinessHours {
  const days = Object.fromEntries(
    WEEKDAYS.map((day) => [day, { open: "09:00", close: "17:00" }]),
  ) as BusinessHours["days"];

  return { timezone, days: { ...days, ...overrides } };
}

describe("selectReplyVariant", () => {
  it("returns in_hours for a time strictly inside the open interval", () => {
    // 2024-01-15 is a Monday. 12:00 UTC in London (UTC+0 in January) → 12:00 Mon.
    const now = new Date("2024-01-15T12:00:00Z");
    expect(selectReplyVariant(now, makeHours("Europe/London"))).toBe("in_hours");
  });

  it("returns away for a time before opening", () => {
    // 08:30 local Monday, before the 09:00 open.
    const now = new Date("2024-01-15T08:30:00Z");
    expect(selectReplyVariant(now, makeHours("Europe/London"))).toBe("away");
  });

  it("returns away for a time after closing", () => {
    // 18:00 local Monday, after the 17:00 close.
    const now = new Date("2024-01-15T18:00:00Z");
    expect(selectReplyVariant(now, makeHours("Europe/London"))).toBe("away");
  });

  it("treats open as inclusive and close as exclusive", () => {
    const hours = makeHours("Europe/London");
    // Exactly 09:00 → in_hours (inclusive open).
    expect(selectReplyVariant(new Date("2024-01-15T09:00:00Z"), hours)).toBe(
      "in_hours",
    );
    // Exactly 17:00 → away (exclusive close).
    expect(selectReplyVariant(new Date("2024-01-15T17:00:00Z"), hours)).toBe(
      "away",
    );
  });

  it("returns away for an unconfigured (null) weekday", () => {
    // 2024-01-15 is a Monday; close Mondays.
    const hours = makeHours("Europe/London", { monday: null });
    const now = new Date("2024-01-15T12:00:00Z");
    expect(selectReplyVariant(now, hours)).toBe("away");
  });

  it("returns away for an invalid timezone rather than throwing", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    expect(() =>
      selectReplyVariant(now, makeHours("Not/AZone")),
    ).not.toThrow();
    expect(selectReplyVariant(now, makeHours("Not/AZone"))).toBe("away");
  });

  describe("DST boundary for Australia/Sydney", () => {
    // Sydney is AEDT (UTC+11) during the southern-hemisphere summer and AEST
    // (UTC+10) during winter. The same UTC offset-of-day therefore maps to
    // different local wall-clock times depending on the date.
    const hours = makeHours("Australia/Sydney");

    it("is in_hours under AEDT (summer, UTC+11)", () => {
      // 2024-01-15T22:30Z → 2024-01-16 09:30 AEDT (Tuesday) → inside 09:00-17:00.
      const now = new Date("2024-01-15T22:30:00Z");
      expect(selectReplyVariant(now, hours)).toBe("in_hours");
    });

    it("is away under AEST (winter, UTC+10) for the same UTC offset-of-day", () => {
      // 2024-07-15T22:30Z → 2024-07-16 08:30 AEST (Tuesday) → before 09:00 open.
      const now = new Date("2024-07-15T22:30:00Z");
      expect(selectReplyVariant(now, hours)).toBe("away");
    });
  });
});

describe("describeNextOpen", () => {
  it("describes opening later today when before open", () => {
    // 08:30 local Monday, opens 09:00.
    const now = new Date("2024-01-15T08:30:00Z");
    expect(describeNextOpen(now, makeHours("Europe/London"))).toContain(
      "today at 09:00",
    );
  });

  it("describes tomorrow when today is already closed", () => {
    // 18:00 local Monday (after close); Tuesday opens 09:00.
    const now = new Date("2024-01-15T18:00:00Z");
    expect(describeNextOpen(now, makeHours("Europe/London"))).toContain(
      "tomorrow at 09:00",
    );
  });

  it("names the next open weekday when the following days are closed", () => {
    // Monday after close, Tuesday/Wednesday closed → next open is Thursday.
    const hours = makeHours("Europe/London", {
      tuesday: null,
      wednesday: null,
    });
    const now = new Date("2024-01-15T18:00:00Z");
    expect(describeNextOpen(now, hours)).toContain("Thursday at 09:00");
  });

  it("returns a generic fallback when no weekday is configured", () => {
    const hours = makeHours("Europe/London");
    for (const day of WEEKDAYS) {
      hours.days[day] = null;
    }
    const now = new Date("2024-01-15T18:00:00Z");
    expect(describeNextOpen(now, hours)).toBe(
      "We'll get back to you as soon as we're open.",
    );
  });

  it("returns the generic fallback for an invalid timezone", () => {
    const now = new Date("2024-01-15T18:00:00Z");
    expect(describeNextOpen(now, makeHours("Not/AZone"))).toBe(
      "We'll get back to you as soon as we're open.",
    );
  });
});
