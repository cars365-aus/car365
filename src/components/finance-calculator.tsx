"use client";

import { useState, useMemo } from "react";
import { estimateRepayments } from "@/lib/finance";
import type { FinanceParams } from "@/lib/domain";
import { formatPrice } from "@/lib/nav";
import { Car, Wallet, FileText } from "lucide-react";

type Frequency = "weekly" | "fortnightly" | "monthly";

export function FinanceCalculator({ price, params }: { price: number; params: FinanceParams }) {
  const [vehiclePrice, setVehiclePrice] = useState<number>(price);
  const [deposit, setDeposit] = useState<number>(Math.round((params.depositPct / 100) * price));
  const [termMonths, setTermMonths] = useState<number>(params.termMonths);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const estimate = useMemo(
    () => estimateRepayments(vehiclePrice, params, { deposit, termMonths }),
    [vehiclePrice, params, deposit, termMonths]
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

  const loanAmount = Math.max(0, vehiclePrice - deposit);

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0a0f1c] p-6 text-white shadow-xl">
      <h3 className="font-heading text-xl font-bold">Finance Calculator</h3>
      
      <div className="mt-8 space-y-6">
        {/* Vehicle Price */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-300">Vehicle Price</span>
            <span className="font-bold">{formatPrice(vehiclePrice)}</span>
          </div>
          <input
            type="range"
            min={5000}
            max={Math.max(100000, price * 1.5)}
            step={500}
            value={vehiclePrice}
            onChange={(e) => {
              setVehiclePrice(Number(e.target.value));
              // Ensure deposit doesn't exceed new price
              if (deposit > Number(e.target.value)) setDeposit(Number(e.target.value));
            }}
            className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>$5,000</span>
            <span>$100,000+</span>
          </div>
        </div>

        {/* Deposit */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-300">Deposit</span>
            <span className="font-bold">{formatPrice(deposit)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={vehiclePrice}
            step={500}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>$0</span>
            <span>{formatPrice(vehiclePrice)}+</span>
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-300">Loan Term</span>
            <span className="font-bold">{termMonths / 12} Years</span>
          </div>
          <input
            type="range"
            min={12}
            max={84}
            step={12}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>1 Year</span>
            <span>7 Years</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-sm font-medium text-slate-300 mb-1">Interest Rate (p.a.)</div>
            <div className="text-xs text-slate-500">Comparison rate {(params.annualRate + 0.48).toFixed(2)}% p.a.*</div>
          </div>
          <div className="font-bold">{params.annualRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="mt-8 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Car className="size-3.5 text-primary" /> Vehicle
          </div>
          <div className="font-bold text-sm sm:text-base">{formatPrice(vehiclePrice)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Wallet className="size-3.5 text-primary" /> Deposit
          </div>
          <div className="font-bold text-sm sm:text-base">{formatPrice(deposit)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <FileText className="size-3.5 text-primary" /> Loan
          </div>
          <div className="font-bold text-sm sm:text-base">{formatPrice(loanAmount)}</div>
        </div>
      </div>

      {/* Result Section */}
      <div className="mt-8 border-t border-slate-800 pt-6 text-center">
        {/* Frequency Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(["weekly", "fortnightly", "monthly"] as Frequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  frequency === f
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimated Repayment</p>
        <p className="font-heading text-5xl font-black text-primary my-3">
          {formatPrice(paymentAmounts[frequency])}<span className="text-xl text-slate-400 font-normal">{frequencyLabels[frequency]}</span>
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500 mt-4 px-2 max-w-sm mx-auto">
          Based on {params.annualRate}% interest rate over {termMonths} months.<br />
          Indicative only, not an offer of finance. Repayment estimates assume a fixed rate over the stated term with the stated deposit and exclude fees and charges. Talk to us for a personalised quote.
        </p>
      </div>
    </div>
  );
}
