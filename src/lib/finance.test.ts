import { describe, it, expect } from "vitest";
import { estimateRepayments, weeklyFrom } from "@/lib/finance";
import type { FinanceParams } from "@/lib/domain";

const params: FinanceParams = {
  annualRate: 8.99,
  termMonths: 60,
  depositPct: 10,
  disclaimer: "Indicative only.",
};

describe("estimateRepayments", () => {
  it("computes a standard amortized payment on a $30k car", () => {
    const est = estimateRepayments(30000, params);
    // 10% deposit → $27,000 principal over 60 months @ 8.99% p.a.
    expect(est.deposit).toBe(3000);
    expect(est.principal).toBe(27000);
    // Monthly ≈ $560; weekly ≈ $129. Allow a small rounding band.
    expect(est.monthly).toBeGreaterThan(540);
    expect(est.monthly).toBeLessThan(580);
    expect(est.weekly).toBeGreaterThan(120);
    expect(est.weekly).toBeLessThan(140);
  });

  it("handles a 0% rate as simple division", () => {
    const est = estimateRepayments(24000, { ...params, annualRate: 0, depositPct: 0, termMonths: 48 });
    expect(est.principal).toBe(24000);
    expect(est.monthly).toBe(500); // 24000 / 48
  });

  it("respects buyer overrides for deposit and term", () => {
    const est = estimateRepayments(40000, params, { deposit: 10000, termMonths: 36 });
    expect(est.deposit).toBe(10000);
    expect(est.termMonths).toBe(36);
    expect(est.principal).toBe(30000);
  });

  it("clamps a deposit larger than the price", () => {
    const est = estimateRepayments(20000, params, { deposit: 50000 });
    expect(est.deposit).toBe(20000);
    expect(est.principal).toBe(0);
    expect(est.weekly).toBe(0);
  });

  it("weeklyFrom returns the weekly figure directly", () => {
    expect(weeklyFrom(30000, params)).toBe(estimateRepayments(30000, params).weekly);
  });
});
