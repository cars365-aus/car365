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
  totalInterest: number;
  totalPayable: number;
};

/** Flat monthly repayment for an amortized loan (0% rate → simple division). */
function amortizedMonthly(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * @param price       drive-away vehicle price
 * @param params      rate/term/deposit assumptions from Site Settings
 * @param overrides   optional buyer-adjusted deposit / term / rate (calculator widget)
 */
export function estimateRepayments(
  price: number,
  params: FinanceParams,
  overrides?: { deposit?: number; termMonths?: number; annualRate?: number },
): RepaymentEstimate {
  const termMonths = Math.max(1, Math.round(overrides?.termMonths ?? params.termMonths));
  const annualRate = Math.max(0, overrides?.annualRate ?? params.annualRate);
  const deposit = Math.max(
    0,
    Math.min(price, overrides?.deposit ?? Math.round((params.depositPct / 100) * price)),
  );
  const principal = Math.max(0, price - deposit);

  const monthly = amortizedMonthly(principal, annualRate, termMonths);
  const weekly = (monthly * 12) / 52;
  const totalPayable = monthly * termMonths;
  const totalInterest = Math.max(0, totalPayable - principal);

  return {
    weekly: Math.round(weekly),
    monthly: Math.round(monthly),
    principal,
    deposit,
    termMonths,
    annualRate,
    totalInterest: Math.round(totalInterest),
    totalPayable: Math.round(totalPayable),
  };
}

/**
 * Indicative rate for a given loan term (Australian secured car loan).
 *
 * Australian lenders anchor an advertised rate to a standard term and price
 * longer terms with a small duration/residual-risk margin (and shorter terms
 * slightly keener). We anchor to the Site Settings term so the advertised rate
 * shows exactly at the default, and apply a modest ±margin per year either side.
 * Clamped to a sane band — this is an estimate, never an offer of finance.
 */
export function rateForTerm(
  baseRate: number,
  termMonths: number,
  baselineMonths = 60,
): number {
  const MARGIN_PER_YEAR = 0.15; // p.a. per year away from the baseline term
  const BAND = 0.6; // never drift more than ±0.6% from the advertised rate
  const yearsFromBaseline = (termMonths - baselineMonths) / 12;
  const adjusted = baseRate + yearsFromBaseline * MARGIN_PER_YEAR;
  const clamped = Math.min(baseRate + BAND, Math.max(baseRate - BAND, adjusted));
  return Math.round(clamped * 100) / 100;
}

/**
 * Regulated comparison rate (NCCP Act) — the single rate that folds in the
 * standard fees, disclosed on the mandated benchmark loan of $30,000 over
 * 5 years. Solved by bisection: the rate at which a fee-free loan has the same
 * lender internal return as the base-rate loan plus its fees.
 *
 * Kept on the benchmark (not the buyer's scenario) exactly as lenders disclose
 * it, so it stays a stable, comparable figure.
 */
export function comparisonRate(
  baseRate: number,
  fees: { establishment?: number; monthly?: number } = {},
): number {
  const L = 30_000;
  const n = 60;
  const establishment = fees.establishment ?? 400;
  const monthlyFee = fees.monthly ?? 10;

  // Borrower's actual monthly outflow at the contract rate, incl. the account fee.
  const cashflow = amortizedMonthly(L, baseRate, n) + monthlyFee;

  // Present value of all repayments at monthly rate i, plus the upfront fee,
  // must equal the amount financed. Find i by bisection.
  const pvGap = (annualRate: number) => {
    const i = annualRate / 100 / 12;
    let pv = -L + establishment; // establishment fee paid upfront
    for (let k = 1; k <= n; k++) pv += cashflow / Math.pow(1 + i, k);
    return pv; // >0 means rate too low, <0 means rate too high
  };

  let lo = baseRate;
  let hi = baseRate + 10;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    if (pvGap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 100) / 100;
}

/** Convenience: just the weekly figure, for the card/VDP teaser. */
export function weeklyFrom(price: number, params: FinanceParams): number {
  return estimateRepayments(price, params).weekly;
}
