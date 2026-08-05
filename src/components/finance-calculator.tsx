"use client";

import { useState, useMemo, useEffect } from "react";
import { Car, Wallet, FileText } from "lucide-react";
import { estimateRepayments, rateForTerm, comparisonRate } from "@/lib/finance";
import type { FinanceParams } from "@/lib/domain";
import { formatPrice } from "@/lib/nav";

const PRICE_MIN = 5_000;
const PRICE_MAX = 100_000;
const PRICE_STEP = 500;
const DEPOSIT_STEP = 250;
const TERM_MIN = 12;
const TERM_MAX = 84;

/** Yellow-fill-to-thumb, grey-remainder track background for a range input. */
function fillStyle(value: number, min: number, max: number) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return {
    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
  };
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-black/30 p-2.5 sm:p-3">
      <span className="text-primary shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-heading text-sm sm:text-base @[480px]:text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export type FinanceSnapshot = {
  price: number;
  deposit: number;
  weekly: number;
  termMonths: number;
};

export function FinanceCalculator({
  price: initialPrice,
  params,
  onChange,
}: {
  price: number;
  params: FinanceParams;
  /** Fires whenever the buyer adjusts the calculator (used to prefill the enquiry form). */
  onChange?: (snapshot: FinanceSnapshot) => void;
}) {
  const startPrice = Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(initialPrice)));
  const [price, setPrice] = useState<number>(startPrice);
  const [deposit, setDeposit] = useState<number>(
    Math.round(((params.depositPct / 100) * startPrice) / DEPOSIT_STEP) * DEPOSIT_STEP,
  );
  const [termMonths, setTermMonths] = useState<number>(params.termMonths);

  // Deposit moves relative to the vehicle price: dragging the price keeps the
  // same deposit proportion (and it can never exceed the price).
  function handlePriceChange(next: number) {
    const ratio = price > 0 ? deposit / price : params.depositPct / 100;
    const scaled = Math.round((ratio * next) / DEPOSIT_STEP) * DEPOSIT_STEP;
    setPrice(next);
    setDeposit(Math.min(next, Math.max(0, scaled)));
  }

  const effectiveDeposit = Math.min(deposit, price);
  const depositPct = price > 0 ? Math.round((effectiveDeposit / price) * 100) : 0;

  // Rate follows Australian secured car-loan practice: anchored to the
  // advertised (settings) rate at the standard term, with a small margin for
  // longer/shorter terms. Comparison rate is the regulated $30k/5yr benchmark.
  const effectiveRate = rateForTerm(params.annualRate, termMonths, params.termMonths);
  const compRate = useMemo(() => comparisonRate(params.annualRate), [params.annualRate]);

  const estimate = useMemo(
    () => estimateRepayments(price, params, { deposit: effectiveDeposit, termMonths, annualRate: effectiveRate }),
    [price, params, effectiveDeposit, termMonths, effectiveRate],
  );

  // Report the current configuration up so the enquiry form can prefill.
  useEffect(() => {
    onChange?.({ price, deposit: effectiveDeposit, weekly: estimate.weekly, termMonths });
  }, [onChange, price, effectiveDeposit, estimate.weekly, termMonths]);

  return (
    <div className="@container rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-lg font-bold text-foreground">Finance Calculator</h2>

      <div className="mt-6 space-y-6">
        {/* Vehicle Price */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">Vehicle Price</span>
            <span className="font-heading text-xl font-bold text-foreground">{formatPrice(price)}</span>
          </div>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={price}
            onChange={(e) => handlePriceChange(Number(e.target.value))}
            className="finance-range"
            style={fillStyle(price, PRICE_MIN, PRICE_MAX)}
            aria-label="Vehicle price"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(PRICE_MIN)}</span>
            <span>{formatPrice(PRICE_MAX)}+</span>
          </div>
        </div>

        {/* Deposit — scales relative to the vehicle price */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Deposit <span className="text-xs text-muted-foreground/70">({depositPct}% of price)</span>
            </span>
            <span className="font-heading text-xl font-bold text-foreground">{formatPrice(effectiveDeposit)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={price}
            step={DEPOSIT_STEP}
            value={effectiveDeposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="finance-range"
            style={fillStyle(effectiveDeposit, 0, price)}
            aria-label="Deposit"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>No deposit</span>
            <span>{formatPrice(price)}</span>
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">Loan Term</span>
            <span className="font-heading text-xl font-bold text-foreground">{termMonths / 12} Years</span>
          </div>
          <input
            type="range"
            min={TERM_MIN}
            max={TERM_MAX}
            step={12}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="finance-range"
            style={fillStyle(termMonths, TERM_MIN, TERM_MAX)}
            aria-label="Loan term"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>1 Year</span>
            <span>7 Years</span>
          </div>
        </div>
      </div>

      {/* Interest rate */}
      <div className="mt-6 flex items-start justify-between border-t border-white/10 pt-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Interest Rate (p.a.)</p>
          <p className="mt-1 text-xs text-muted-foreground">Comparison rate {compRate.toFixed(2)}% p.a.*</p>
        </div>
        <p className="font-heading text-xl font-bold text-foreground">{effectiveRate.toFixed(2)}%</p>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 @[480px]:grid-cols-3">
        <StatCard icon={<Car className="h-5 w-5" />} label="Vehicle Price" value={formatPrice(price)} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Deposit" value={formatPrice(effectiveDeposit)} />
        <StatCard icon={<FileText className="h-5 w-5" />} label="Loan Amount" value={formatPrice(estimate.principal)} />
      </div>

      {/* Estimated repayment */}
      <div className="mt-6 border-t border-white/10 pt-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estimated Repayment</p>
        <p className="my-2 font-heading text-5xl font-black text-primary drop-shadow-md">
          {formatPrice(estimate.weekly)}
          <span className="text-xl font-normal text-muted-foreground">/wk</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(estimate.totalInterest)} total interest over the {termMonths / 12}-year term
        </p>
        <p className="mt-3 px-2 text-xs leading-relaxed text-muted-foreground">
          Based on {effectiveRate.toFixed(2)}% p.a. over {termMonths} months.
          <br />
          {params.disclaimer}
        </p>
        <p className="mt-2 px-2 text-[11px] leading-relaxed text-muted-foreground/70">
          *Comparison rate based on a $30,000 secured loan over 5 years. WARNING: this comparison rate is
          true only for the example given and may not include all fees and charges. Different terms, fees or
          loan amounts might result in a different comparison rate.
        </p>
      </div>
    </div>
  );
}
