import { describe, it, expect, afterEach } from "vitest";
import {
  API_PROVIDERS,
  PLANNED_PROVIDERS,
  TRACKED_PROVIDER_CODES,
  estimateCost,
  getProvider,
  isProviderConfigured,
  quotaUsedPct,
} from "./providers";

/**
 * The dashboard presents these figures as money, so the arithmetic and the
 * honesty rules around it need to hold — particularly the distinction between
 * "free" and "not billed per call", which are very different things to show an
 * admin deciding whether to keep using a service.
 */

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("registry integrity", () => {
  it("has unique provider codes across live and planned", () => {
    const codes = [...API_PROVIDERS, ...PLANNED_PROVIDERS].map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("exposes only the providers this app actually instruments", () => {
    expect([...TRACKED_PROVIDER_CODES].sort()).toEqual(["photon", "ses", "turnstile", "typesense"]);
  });

  it("gives every provider a console link and a call site, so a spike is diagnosable", () => {
    for (const p of [...API_PROVIDERS, ...PLANNED_PROVIDERS]) {
      expect(p.consoleUrl).toMatch(/^https:\/\//);
      expect(p.callSite.length).toBeGreaterThan(0);
      expect(p.pricingCheckedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("does not claim to track a provider it cannot count", () => {
    // Sentry's SDK reports directly from client and server, bypassing our code;
    // Supabase is deliberately uninstrumented to keep listing pages fast.
    expect(getProvider("sentry")?.tracked).toBe(false);
    expect(getProvider("supabase")?.tracked).toBe(false);
  });
});

describe("estimateCost", () => {
  it("returns null for services that are not billed per call", () => {
    // Typesense bills per node-hour: showing $0.00 would imply it is free.
    expect(estimateCost(getProvider("typesense")!, 100_000)).toBeNull();
  });

  it("returns 0 for genuinely free services", () => {
    expect(estimateCost(getProvider("turnstile")!, 500_000)).toBe(0);
  });

  it("prices metered usage per 1,000 units", () => {
    const ses = getProvider("ses")!;
    expect(estimateCost(ses, 10_000)).toBeCloseTo((10_000 / 1000) * ses.audPer1000!, 6);
  });

  it("charges only usage beyond a free quota", () => {
    const quotaProvider = { ...getProvider("ses")!, monthlyQuota: 1_000, audPer1000: 10 };
    expect(estimateCost(quotaProvider, 500)).toBe(0);
    expect(estimateCost(quotaProvider, 1_500)).toBeCloseTo(5, 6);
  });
});

describe("quotaUsedPct", () => {
  it("is null when the provider has no quota to breach", () => {
    expect(quotaUsedPct(getProvider("typesense")!, 5_000)).toBeNull();
  });

  it("caps at 100 so the progress bar cannot overflow", () => {
    const sentry = getProvider("sentry")!;
    expect(quotaUsedPct(sentry, sentry.monthlyQuota! * 3)).toBe(100);
  });

  it("computes the proportion consumed", () => {
    const sentry = getProvider("sentry")!;
    expect(quotaUsedPct(sentry, sentry.monthlyQuota! / 4)).toBe(25);
  });
});

describe("isProviderConfigured", () => {
  it("is true for a service that needs no credentials", () => {
    expect(isProviderConfigured(getProvider("photon")!)).toBe(true);
  });

  it("requires every declared env var, not just one", () => {
    const typesense = getProvider("typesense")!;
    process.env.TYPESENSE_HOST = "example.typesense.net";
    delete process.env.TYPESENSE_API_KEY;
    expect(isProviderConfigured(typesense)).toBe(false);

    process.env.TYPESENSE_API_KEY = "key";
    expect(isProviderConfigured(typesense)).toBe(true);
  });

  it("treats a blank value as unset", () => {
    process.env.TYPESENSE_HOST = "   ";
    process.env.TYPESENSE_API_KEY = "key";
    expect(isProviderConfigured(getProvider("typesense")!)).toBe(false);
  });
});
