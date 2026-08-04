import { z } from "zod";

/**
 * Syndication sidecar validation (migration 0014).
 *
 * These are the canonical fields the legacy `vehicles` table does not carry.
 * Deliberately lenient in the same way `vehicle.ts` is — staff must be able to
 * save a half-complete car — with one exception: nothing here is silently
 * defaulted. `price_type` in particular stays `undefined` until a human picks
 * one, because inferring drive-away vs ex-government is a misleading-price
 * exposure under Australian Consumer Law (failure-modes.md F8).
 *
 * Readiness for publishing is a separate concern, evaluated by the adapters
 * (see `syndicationReadiness` in `src/lib/data/syndication.ts`).
 */

export const syndicationConditions = ["used", "cpo", "demo"] as const;
export const syndicationPriceTypes = ["drive_away", "ex_gov"] as const;
export const auStates = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

/** Empty string → undefined, so an unselected <select> doesn't trip the enum. */
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.enum(values).optional(),
  );

/** Empty string → undefined for optional `type="date"` inputs. */
const optionalDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().date().optional(),
);

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) || n === 0 ? undefined : n;
    },
    z.number().int().min(min).max(max).optional(),
  );

/**
 * ISO 3779 VIN: exactly 17 characters, and never I, O or Q — they are excluded
 * from the standard precisely because they are confusable with 1 and 0. A VIN
 * containing one is a transcription error, and publishing it produces a
 * listing Google will reject or, worse, silently mis-attribute to another car.
 *
 * This is stricter than the existing length-only check in `vehicle.ts`, which
 * is why VIN validation for syndication lives here rather than being loosened
 * into the website's own schema.
 */
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(VIN_PATTERN, {
    message: "VIN must be 17 characters using A–Z (excluding I, O, Q) and 0–9",
  });

/** True when a string is a structurally valid VIN. Safe on null/undefined. */
export function isValidVin(vin: string | null | undefined): boolean {
  if (!vin) return false;
  return VIN_PATTERN.test(vin.trim().toUpperCase());
}

export const syndicationExtraSchema = z.object({
  vehicleId: z.string().uuid(),
  regoState: optionalEnum(auStates),
  buildDate: optionalDate,
  complianceDate: optionalDate,
  wovrFlag: z.boolean().optional().default(false),
  condition: z.enum(syndicationConditions).optional().default("used"),
  priceType: optionalEnum(syndicationPriceTypes), // never defaulted — see F8
  badge: z.string().trim().max(80).optional().or(z.literal("")),
  engineCc: optionalInt(50, 10000),
  /**
   * Optimistic-lock token read when the editor was opened. A mismatch means
   * another staff member saved in the meantime (failure-modes.md F13).
   */
  version: z.coerce.number().int().positive().optional(),
});

export type SyndicationExtraInput = z.infer<typeof syndicationExtraSchema>;
