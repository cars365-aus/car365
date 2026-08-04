import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  __resetUsageMemory,
  dayKey,
  getUsage,
  recentDayKeys,
  recordApiCall,
  trackApiCall,
} from "./usage";

/**
 * These counters run on the hot path of real user requests, so the property
 * that matters most is that instrumentation is invisible: it must never throw,
 * never swallow a caller's error, and never change a return value.
 *
 * REDIS_URL is unset here, so these exercise the in-memory fallback.
 */
const ORIGINAL_REDIS_URL = process.env.REDIS_URL;

beforeEach(() => {
  delete process.env.REDIS_URL;
  __resetUsageMemory();
});

afterEach(() => {
  if (ORIGINAL_REDIS_URL === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = ORIGINAL_REDIS_URL;
});

const AT = new Date("2026-08-04T02:00:00Z"); // midday in Sydney

describe("day bucketing", () => {
  it("buckets by the dealer's timezone, not UTC", () => {
    // 2026-08-04T22:00Z is already the 5th in Sydney (UTC+10). Bucketing in UTC
    // would file this under the wrong business day.
    expect(dayKey(new Date("2026-08-04T22:00:00Z"))).toBe("2026-08-05");
    expect(dayKey(new Date("2026-08-04T02:00:00Z"))).toBe("2026-08-04");
  });

  it("returns the requested number of consecutive days, oldest first", () => {
    const keys = recentDayKeys(3, AT);
    expect(keys).toEqual(["2026-08-02", "2026-08-03", "2026-08-04"]);
  });
});

describe("recordApiCall", () => {
  it("counts requests and errors separately", async () => {
    recordApiCall("typesense", { ok: true }, AT);
    recordApiCall("typesense", { ok: true }, AT);
    recordApiCall("typesense", { ok: false }, AT);

    const usage = await getUsage(["typesense"], 1, AT);
    expect(usage.providers[0]).toMatchObject({ code: "typesense", requests: 3, errors: 1 });
  });

  it("averages only the calls that reported a duration", async () => {
    recordApiCall("ses", { ok: true, durationMs: 100 }, AT);
    recordApiCall("ses", { ok: true, durationMs: 300 }, AT);
    recordApiCall("ses", { ok: true }, AT); // untimed — must not drag the mean to 0

    const usage = await getUsage(["ses"], 1, AT);
    expect(usage.providers[0].avgMs).toBe(200);
  });

  it("reports avgMs as null when nothing was timed", async () => {
    recordApiCall("photon", { ok: true }, AT);
    expect((await getUsage(["photon"], 1, AT)).providers[0].avgMs).toBeNull();
  });

  it("keeps providers isolated from each other", async () => {
    recordApiCall("typesense", { ok: true }, AT);
    recordApiCall("ses", { ok: false }, AT);

    const usage = await getUsage(["typesense", "ses"], 1, AT);
    expect(usage.providers.find((p) => p.code === "typesense")).toMatchObject({ requests: 1, errors: 0 });
    expect(usage.providers.find((p) => p.code === "ses")).toMatchObject({ requests: 1, errors: 1 });
  });

  it("never throws, whatever it is handed", () => {
    expect(() => recordApiCall("typesense", { ok: true, durationMs: NaN }, AT)).not.toThrow();
    expect(() => recordApiCall("", { ok: false }, AT)).not.toThrow();
  });
});

describe("getUsage", () => {
  it("reports zeroes rather than failing when nothing has been recorded", async () => {
    const usage = await getUsage(["typesense"], 7, AT);
    expect(usage.providers[0]).toMatchObject({ requests: 0, errors: 0, avgMs: null });
    expect(usage.daily).toHaveLength(7);
  });

  it("flags non-durable storage so the dashboard can warn about undercounting", async () => {
    expect((await getUsage(["typesense"], 1, AT)).durable).toBe(false);
  });

  it("splits totals across days and returns them oldest first", async () => {
    const yesterday = new Date(AT.getTime() - 24 * 60 * 60 * 1000);
    recordApiCall("typesense", { ok: true }, yesterday);
    recordApiCall("typesense", { ok: true }, AT);
    recordApiCall("typesense", { ok: true }, AT);

    const usage = await getUsage(["typesense"], 2, AT);
    expect(usage.daily.map((d) => d.requests)).toEqual([1, 2]);
    expect(usage.providers[0].requests).toBe(3);
  });

  it("excludes days outside the window", async () => {
    recordApiCall("typesense", { ok: true }, new Date(AT.getTime() - 5 * 24 * 60 * 60 * 1000));
    expect((await getUsage(["typesense"], 2, AT)).providers[0].requests).toBe(0);
  });
});

describe("trackApiCall", () => {
  it("returns the wrapped value unchanged and counts a success", async () => {
    const result = await trackApiCall("typesense", async () => ({ hits: 3 }));
    expect(result).toEqual({ hits: 3 });
    expect((await getUsage(["typesense"], 1)).providers[0]).toMatchObject({ requests: 1, errors: 0 });
  });

  it("re-throws the original error untouched and counts a failure", async () => {
    const boom = new Error("typesense unreachable");
    await expect(trackApiCall("typesense", async () => { throw boom; })).rejects.toBe(boom);
    expect((await getUsage(["typesense"], 1)).providers[0]).toMatchObject({ requests: 1, errors: 1 });
  });
});
