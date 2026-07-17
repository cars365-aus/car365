"use client";

import { useState, useMemo } from "react";
import { estimateRepayments } from "@/lib/finance";
import type { FinanceParams } from "@/lib/domain";
import { formatPrice } from "@/lib/nav";

type Frequency = "weekly" | "fortnightly" | "monthly";

export function FinanceCalculator({ price, params }: { price: number; params: FinanceParams }) {
  const [deposit, setDeposit] = useState<number>(Math.round((params.depositPct / 100) * price));
  const [termMonths, setTermMonths] = useState<number>(params.termMonths);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const estimate = useMemo(
    () => estimateRepayments(price, params, { deposit, termMonths }),
    [price, params, deposit, termMonths]
  );

  const paymentAmounts: Record<Frequency, number> = {
    weekly: estimate.weekly,
    fortnightly: estimate.fortnightly,
    monthly: estimate.monthly,
  };

  const frequencyLabels: Record<Frequency, string> = {
    weekly: "/wk",
    fortnightly: "/fn",
    monthly: "/mo",
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-slate-50 p-5">
      <h3 className="font-heading text-lg font-bold text-foreground">Finance Calculator</h3>
      
      <div className="mt-5 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="text-sm text-muted-foreground font-medium">Vehicle Price</span>
          <span className="font-heading text-lg font-bold text-foreground">{formatPrice(price)}</span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">Deposit</span>
            <span className="font-bold text-foreground">{formatPrice(deposit)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={price * 0.5}
            step={500}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">Loan Term</span>
            <span className="font-bold text-foreground">{termMonths / 12} Years</span>
          </div>
          <input
            type="range"
            min={12}
            max={84}
            step={12}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-background border border-border rounded-lg p-1">
            {(["weekly", "fortnightly", "monthly"] as Frequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  frequency === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Approximate Repayment</p>
        <p className="font-heading text-5xl font-black text-primary my-2 drop-shadow-md">
          {formatPrice(paymentAmounts[frequency])}<span className="text-xl text-muted-foreground font-normal">{frequencyLabels[frequency]}</span>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground mt-3 px-2">
          <strong>* This is an approximate estimate only.</strong><br />
          Based on {params.annualRate}% interest rate over {termMonths} months.<br />
          {params.disclaimer}
        </p>
      </div>
    </div>
  );
}
