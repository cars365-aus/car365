import type { FinanceParams } from "@/lib/domain";

/**
 * Indicative finance repayment maths (SRS FR-13).
 *
 * Standard amortized loan. Always paired with the disclaimer from
 * settings.finance_params — this is an estimate, never an offer of finance.
 */

export type RepaymentEstimate = {
  weekly: number;
  monthly: number;
  principal: number;
  deposit: number;
  termMonths: number;
  annualRate: number;
};

/**
 * @param price       drive-away vehicle price
 * @param params      rate/term/deposit assumptions from Site Settings
 * @param overrides   optional buyer-adjusted deposit / term (calculator widget)
 */
export function estimateRepayments(
  price: number,
  params: FinanceParams,
  overrides?: { deposit?: number; termMonths?: number },
): RepaymentEstimate {
  const termMonths = Math.max(1, Math.round(overrides?.termMonths ?? params.termMonths));
  const deposit = Math.max(
    0,
    Math.min(price, overrides?.deposit ?? Math.round((params.depositPct / 100) * price)),
  );
  const principal = Math.max(0, price - deposit);
  const annualRateDec = params.annualRate / 100;

  // Monthly Calculation
  const monthlyRate = annualRateDec / 12;
  let monthly: number;
  if (monthlyRate === 0) {
    monthly = principal / termMonths;
  } else {
    const factorM = Math.pow(1 + monthlyRate, termMonths);
    monthly = (principal * monthlyRate * factorM) / (factorM - 1);
  }

  // Weekly Calculation (Standard Australian Practice)
  const termWeeks = Math.round(termMonths * (52 / 12));
  const weeklyRate = annualRateDec / 52;
  let weekly: number;
  if (weeklyRate === 0) {
    weekly = principal / termWeeks;
  } else {
    const factorW = Math.pow(1 + weeklyRate, termWeeks);
    weekly = (principal * weeklyRate * factorW) / (factorW - 1);
  }

  return {
    weekly: Math.round(weekly),
    monthly: Math.round(monthly),
    principal,
    deposit,
    termMonths,
    annualRate: params.annualRate,
  };
}

/** Convenience: just the weekly figure, for the card/VDP teaser. */
export function weeklyFrom(price: number, params: FinanceParams): number {
  return estimateRepayments(price, params).weekly;
}
