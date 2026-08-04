import { isValidVin } from "@/lib/validation/syndication";
import type { CanonicalVehicle, Rejection, Warning } from "@/lib/syndication/types";

/**
 * Channel-independent publish gates.
 *
 * PURE: no I/O, no clock, no randomness — the contract every adapter transform
 * must honour (architecture.md §5). Purity is what lets the vehicle editor show
 * staff exactly what will be rejected *before* publishing, using the identical
 * code path that runs at push time. Two implementations would drift and destroy
 * trust in the readiness indicator (CLAUDE.md architecture invariants).
 *
 * These are the gates that hold for EVERY channel. Channel-specific rules
 * (Google's VIN uniqueness, Meta's 805 km odometer floor, per-channel enum
 * mapping) belong in the individual adapters in Sprint 2 and layer on top.
 *
 * Nothing here ever defaults or guesses a value. Every gate either passes on
 * data that is actually present, or rejects with a reason a non-engineer can
 * act on (failure-modes.md F6, F19).
 */

/** Minimum photos before a listing is worth publishing (failure-modes.md F25). */
export const MIN_PUBLISH_IMAGES = 3;

export type ReadinessResult = {
  ready: boolean;
  rejections: Rejection[];
  warnings: Warning[];
};

/**
 * Evaluates the base publish gates for one vehicle.
 *
 * `opts.vinDuplicates` carries VINs known to appear on more than one active
 * vehicle. Uniqueness is inherently a set-level property, so it cannot be
 * derived from a single row — the caller computes it once and passes it in,
 * which keeps this function pure (failure-modes.md F9).
 */
export function evaluateReadiness(
  v: CanonicalVehicle,
  opts: { vinDuplicates?: ReadonlySet<string> } = {},
): ReadinessResult {
  const rejections: Rejection[] = [];
  const warnings: Warning[] = [];

  // ── Identity ──────────────────────────────────────────────────────────────
  if (!v.vin) {
    rejections.push({
      code: "MISSING_VIN",
      field: "vin",
      message: "This vehicle has no VIN, so it cannot be advertised on Google or most classifieds.",
      fixHint: "Add the 17-character VIN in the Identity & Compliance section of the vehicle editor.",
    });
  } else if (!isValidVin(v.vin)) {
    rejections.push({
      code: "INVALID_VIN",
      field: "vin",
      message: `"${v.vin}" is not a valid VIN. A VIN is exactly 17 characters and never contains the letters I, O or Q.`,
      fixHint: "Re-check the VIN against the compliance plate — 1 and 0 are often mistyped as I and O.",
    });
  } else if (opts.vinDuplicates?.has(v.vin.trim().toUpperCase())) {
    // Google rejects BOTH rows on a duplicate; do not silently pick one.
    rejections.push({
      code: "DUPLICATE_VIN",
      field: "vin",
      message: "Another active vehicle already uses this VIN. Channels reject every listing that shares a VIN.",
      fixHint: "Check whether this car has been entered twice, or correct whichever VIN was mistyped.",
    });
  }

  // ── Commercial ────────────────────────────────────────────────────────────
  if (v.priceAmount == null || v.priceAmount <= 0) {
    rejections.push({
      code: "MISSING_PRICE",
      field: "priceAmount",
      message: "This vehicle has no advertised price.",
      fixHint: "Set the price in the Pricing tab.",
    });
  }

  // F8: drive-away vs ex-government is never inferred. Advertising the wrong
  // one is a misleading-price exposure, not a formatting detail.
  if (!v.priceType) {
    rejections.push({
      code: "MISSING_PRICE_TYPE",
      field: "priceType",
      message: "It's not recorded whether this price is drive-away or excludes on-road costs.",
      fixHint: "Choose a price type in the Identity & Compliance section. This cannot be assumed for you.",
    });
  }

  // ── Media (F25) ───────────────────────────────────────────────────────────
  if (v.imageCount === 0) {
    rejections.push({
      code: "MEDIA_NOT_READY",
      field: "images",
      message: "This vehicle has no photos. Channels reject listings without images.",
      fixHint: "Upload photos in the Images tab.",
    });
  } else if (v.imageCount < MIN_PUBLISH_IMAGES) {
    warnings.push({
      code: "FEW_IMAGES",
      field: "images",
      message: `Only ${v.imageCount} photo${v.imageCount === 1 ? "" : "s"}. Listings with ${MIN_PUBLISH_IMAGES}+ photos perform materially better.`,
    });
  }

  // ── Compliance ────────────────────────────────────────────────────────────
  // F27: a repairable write-off must be disclosed. Where a channel has no
  // structured field for it, the disclosure has to appear in the description —
  // so a WOVR vehicle with no description at all can never publish compliantly.
  if (v.wovrFlag) {
    const prose = `${v.descriptionRaw ?? ""} ${v.descriptionGenerated ?? ""}`.toLowerCase();
    const discloses = /wovr|written[- ]off|write[- ]off|repairable/.test(prose);
    if (!discloses) {
      rejections.push({
        code: "WOVR_NOT_DISCLOSED",
        field: "description",
        message: "This vehicle is flagged on the written-off register, but the description doesn't disclose it.",
        fixHint: "Add the written-off disclosure to the description. This is a legal requirement, not a preference.",
      });
    }
  }

  // ── Generated copy (Hard Rule 4 / F5) ─────────────────────────────────────
  // Generated text is a draft until a human approves it. Publishing unreviewed
  // AI copy that invents features is a false-advertising claim against the
  // dealer, so an unapproved draft blocks rather than falling back silently.
  if (v.descriptionGenerated && !v.descriptionApprovedAt) {
    rejections.push({
      code: "DESCRIPTION_NOT_APPROVED",
      field: "descriptionGenerated",
      message: "This vehicle has an AI-drafted description that nobody has approved yet.",
      fixHint: "Review the generated description and approve it, or clear it to advertise with the original text.",
    });
  }

  if (!v.descriptionRaw && !v.descriptionGenerated) {
    warnings.push({
      code: "NO_DESCRIPTION",
      field: "description",
      message: "No description. Most channels rank listings with written detail higher.",
    });
  }

  return { ready: rejections.length === 0, rejections, warnings };
}

/**
 * VINs shared by more than one vehicle in the given set, upper-cased.
 * Feed the result to `evaluateReadiness` via `opts.vinDuplicates`.
 */
export function findDuplicateVins(
  vehicles: readonly Pick<CanonicalVehicle, "vin">[],
): Set<string> {
  const seen = new Map<string, number>();
  for (const v of vehicles) {
    if (!v.vin) continue;
    const vin = v.vin.trim().toUpperCase();
    seen.set(vin, (seen.get(vin) ?? 0) + 1);
  }
  return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([vin]) => vin));
}
