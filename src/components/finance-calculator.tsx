"use client";

import { useMemo, useState } from "react";
import { estimateRepayments } from "@/lib/finance";
import { formatPrice } from "@/lib/nav";
import type { FinanceParams } from "@/lib/domain";

/**
 * Interactive repayment calculator (SRS FR-13). Buyer adjusts price, deposit and
 * term; weekly/monthly update live. Always shown with the finance disclaimer.
 */
export function FinanceCalculator({
  params,
  initialPrice = 30000,
}: {
  params: FinanceParams;
  initialPrice?: number;
}) {
  const [price, setPrice] = useState(initialPrice);
  const [deposit, setDeposit] = useState(Math.round((params.depositPct / 100) * initialPrice));
  const [term, setTerm] = useState(params.termMonths);

  const est = useMemo(
    () => estimateRepayments(price, params, { deposit, termMonths: term }),
    [price, deposit, term, params],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-bold text-foreground">Estimate your repayments</h3>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-sm font-medium text-foreground">
            Car price <span className="tabular-nums text-primary">{formatPrice(price)}</span>
          </span>
          <input
            type="range" min={5000} max={150000} step={500}
            value={price}
            onChange={(e) => { const p = Number(e.target.value); setPrice(p); if (deposit > p) setDeposit(p); }}
            className="w-full accent-[var(--primary)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-sm font-medium text-foreground">
            Deposit <span className="tabular-nums text-primary">{formatPrice(deposit)}</span>
          </span>
          <input
            type="range" min={0} max={price} step={500}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-foreground">Loan term</span>
          <select
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground"
          >
            {[24, 36, 48, 60, 72, 84].map((m) => (
              <option key={m} value={m}>{m} months ({m / 12} years)</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground">Weekly from</p>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-primary">{formatPrice(est.weekly)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground">Monthly from</p>
          <p className="font-heading text-2xl font-extrabold tabular-nums text-foreground">{formatPrice(est.monthly)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Based on a {params.annualRate}% p.a. indicative rate over {term} months. {params.disclaimer}
      </p>
    </div>
  );
}
