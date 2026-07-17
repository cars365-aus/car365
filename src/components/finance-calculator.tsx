"use client";

import { useState, useMemo } from "react";
import { estimateRepayments } from "@/lib/finance";
import type { FinanceParams } from "@/lib/domain";
import { formatPrice } from "@/lib/nav";

export function FinanceCalculator({ price, params }: { price: number; params: FinanceParams }) {
  const [deposit, setDeposit] = useState<number>(Math.round((params.depositPct / 100) * price));
  const [termMonths, setTermMonths] = useState<number>(params.termMonths);

  const estimate = useMemo(
    () => estimateRepayments(price, params, { deposit, termMonths }),
    [price, params, deposit, termMonths]
  );

  return (
    <div className="mt-6 rounded-xl border border-border bg-black/20 p-5 shadow-inner">
      <h3 className="font-heading text-lg font-bold text-foreground">Finance Calculator</h3>
      
      <div className="mt-5 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
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

      <div className="mt-6 border-t border-white/10 pt-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estimated Repayment</p>
        <p className="font-heading text-5xl font-black text-primary my-2 drop-shadow-md">
          {formatPrice(estimate.weekly)}<span className="text-xl text-muted-foreground font-normal">/wk</span>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground mt-3 px-2">
          Based on {params.annualRate}% interest rate over {termMonths} months.<br />
          {params.disclaimer}
        </p>
      </div>
    </div>
  );
}
