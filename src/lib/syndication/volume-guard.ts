/**
 * The volume guard — the most important safety mechanism in the syndication
 * module (docs/syndication/SYNDICATION-CLAUDE.md).
 *
 * ── What it protects against ────────────────────────────────────────────────
 * Every channel treats a feed as the COMPLETE inventory: anything missing is
 * treated as deleted. So a partial render — a database timeout, one adapter
 * throwing, a truncated storage write — does not degrade gracefully. It
 * publishes a short feed, and the channel removes every listing not in it.
 * That is not a bug with a rollback; it is the dealer's entire advertised
 * inventory disappearing from Google and Meta (failure-modes.md F1).
 *
 * This guard is the thing standing between a transient error and that outcome.
 *
 * ── PURE by design ──────────────────────────────────────────────────────────
 * No I/O, no clock, no randomness. The caller supplies the previous run's
 * counts and the current attempt's shape; this decides. That makes every
 * abort condition exhaustively testable, which matters more here than
 * anywhere else in the module — an untested safety mechanism is decoration.
 */

/** Default abort threshold: a drop of more than 20% of items. */
export const DEFAULT_MAX_DROP_PCT = 0.2;

export type VolumeGuardInput = {
  /** Items the current render produced and would publish. */
  currentItemCount: number;
  /**
   * Item count of the last SUCCESSFUL run, or null when there is none (a first
   * run has no baseline and cannot be compared).
   */
  previousItemCount: number | null;
  /** True if any adapter threw while rendering this batch. */
  adapterThrew?: boolean;
  /**
   * True if the source projection query errored or returned partial results.
   * A partial read is indistinguishable from genuine inventory shrinkage, so it
   * is always an abort regardless of the percentage.
   */
  sourceQueryDegraded?: boolean;
  /**
   * Explicit human override. Only ever honoured together with `forcedBy` — an
   * override that wipes a dealer's listings must be attributable to a person.
   */
  force?: boolean;
  forcedBy?: string | null;
};

export type VolumeGuardVerdict =
  | { publish: true; forced: boolean; reason: null }
  | { publish: false; forced: false; reason: string; code: VolumeGuardCode };

export type VolumeGuardCode =
  | "ADAPTER_THREW"
  | "SOURCE_DEGRADED"
  | "ZERO_ITEMS"
  | "DROP_EXCEEDED";

/**
 * Reads the configured threshold as a fraction (0–1).
 *
 * A malformed or out-of-range `FEED_MAX_DROP_PCT` falls back to the default
 * rather than being trusted: a typo'd `20` (meaning 20%) would otherwise parse
 * as 2000% and disable the guard entirely — exactly when it is needed.
 */
export function getMaxDropPct(): number {
  const raw = process.env.FEED_MAX_DROP_PCT;
  if (!raw) return DEFAULT_MAX_DROP_PCT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) return DEFAULT_MAX_DROP_PCT;
  return parsed;
}

/**
 * Decides whether a rendered batch may be published.
 *
 * Abort conditions, in order of precedence:
 *   1. An adapter threw          → the batch is untrustworthy, full stop.
 *   2. The source query degraded → we cannot tell shrinkage from a failed read.
 *   3. Zero items after a non-zero run → always wrong, at any threshold.
 *   4. Drop exceeds the threshold.
 *
 * Conditions 1 and 2 are NOT overridable by `force`: forcing past a thrown
 * adapter means knowingly publishing a feed you know to be incomplete. Only a
 * volume drop — which a human can legitimately verify as real, e.g. after a
 * genuine clearance sale — may be forced.
 */
export function evaluateVolumeGuard(input: VolumeGuardInput): VolumeGuardVerdict {
  const {
    currentItemCount,
    previousItemCount,
    adapterThrew = false,
    sourceQueryDegraded = false,
    force = false,
    forcedBy = null,
  } = input;

  if (adapterThrew) {
    return {
      publish: false,
      forced: false,
      code: "ADAPTER_THREW",
      reason:
        "An adapter threw while rendering this feed, so the output is incomplete. " +
        "Publishing it would delete every listing missing from it. The previous feed is still being served.",
    };
  }

  if (sourceQueryDegraded) {
    return {
      publish: false,
      forced: false,
      code: "SOURCE_DEGRADED",
      reason:
        "The vehicle query errored or returned partial results, so we cannot tell a real drop in stock " +
        "from a failed read. The previous feed is still being served.",
    };
  }

  const validForce = force && Boolean(forcedBy);
  const hasBaseline = previousItemCount != null && previousItemCount > 0;

  if (currentItemCount === 0 && hasBaseline) {
    if (validForce) return { publish: true, forced: true, reason: null };
    return {
      publish: false,
      forced: false,
      code: "ZERO_ITEMS",
      reason:
        `This render produced 0 vehicles, but the last successful run published ${previousItemCount}. ` +
        "Publishing an empty feed removes every listing on this channel.",
    };
  }

  if (hasBaseline) {
    const dropPct = (previousItemCount - currentItemCount) / previousItemCount;
    const threshold = getMaxDropPct();
    if (dropPct > threshold) {
      if (validForce) return { publish: true, forced: true, reason: null };
      return {
        publish: false,
        forced: false,
        code: "DROP_EXCEEDED",
        reason:
          `This render has ${currentItemCount} vehicles, down from ${previousItemCount} — a ` +
          `${(dropPct * 100).toFixed(1)}% drop, over the ${(threshold * 100).toFixed(0)}% safety limit. ` +
          "The previous feed is still being served. If this reduction is genuine, re-run with an override.",
      };
    }
  }

  return { publish: true, forced: false, reason: null };
}
