import type { Rejection } from "@/lib/syndication/types";

/**
 * Channel enum mapping — fail loud, never default.
 *
 * Every channel has its own closed vocabulary for body type, transmission,
 * fuel, drivetrain and condition. When a canonical value has no mapping, the
 * ONLY correct behaviour is to reject the vehicle and tell staff exactly which
 * value needs mapping.
 *
 * The tempting alternative — falling back to a "sensible" default — publishes a
 * factually wrong advertisement. Defaulting an unmapped body type to "Sedan"
 * means a customer drives across Sydney to look at a ute they were shown as a
 * sedan. That is a false-advertising exposure, not a formatting nicety
 * (failure-modes.md F6).
 *
 * PURE: the caller loads the mapping rows once per sync run and passes them in,
 * so adapter transforms stay free of I/O (architecture.md §5).
 */

/** One `channel_enum_map` row, in the shape adapters consume. */
export type EnumMapRow = {
  canonicalField: string;
  canonicalValue: string;
  channelValue: string;
};

/** Fast lookup keyed `field:value`, built once per sync run. */
export type EnumMap = ReadonlyMap<string, string>;

const key = (field: string, value: string) => `${field}:${value}`;

/** Builds the lookup map from raw rows for a single channel. */
export function buildEnumMap(rows: readonly EnumMapRow[]): EnumMap {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(key(row.canonicalField, row.canonicalValue), row.channelValue);
  }
  return map;
}

export type MapResult =
  | { ok: true; value: string }
  | { ok: false; rejection: Rejection };

/**
 * Translates one canonical value into its channel equivalent.
 *
 * A missing mapping produces a rejection naming the exact field and value, so a
 * non-engineer can add the row in the admin screen without reading code or
 * guessing what broke.
 */
export function mapEnum(
  enumMap: EnumMap,
  field: string,
  canonicalValue: string | null | undefined,
  opts: { channelName: string; required?: boolean } = { channelName: "this channel" },
): MapResult {
  if (canonicalValue == null || canonicalValue === "") {
    if (opts.required === false) return { ok: true, value: "" };
    return {
      ok: false,
      rejection: {
        code: "MISSING_ENUM_VALUE",
        field,
        message: `This vehicle has no ${humanField(field)}, which ${opts.channelName} requires.`,
        fixHint: `Set the ${humanField(field)} in the vehicle editor.`,
      },
    };
  }

  const mapped = enumMap.get(key(field, canonicalValue));
  if (mapped === undefined) {
    return {
      ok: false,
      rejection: {
        code: "UNMAPPED_ENUM",
        field,
        // The exact unmapped value is quoted: without it, staff cannot tell
        // which of several vehicles or values is the problem.
        message:
          `${opts.channelName} has no equivalent recorded for the ${humanField(field)} "${canonicalValue}", ` +
          "so this vehicle cannot be published there.",
        fixHint: `Add a mapping for "${canonicalValue}" under ${humanField(field)} in Settings → Channel mappings.`,
      },
    };
  }

  return { ok: true, value: mapped };
}

/** Turns a snake_case canonical field into staff-facing words. */
function humanField(field: string): string {
  return field.replace(/_/g, " ");
}

/**
 * Canonical values that must have a mapping for every channel, per field.
 * Used by a coverage check so a gap is found at seed/deploy time rather than
 * at publish time on a real customer's car.
 */
export const CANONICAL_ENUM_VALUES: Readonly<Record<string, readonly string[]>> = {
  body_type: ["sedan", "hatch", "suv", "ute", "wagon", "coupe", "convertible", "van", "people_mover"],
  fuel_type: ["petrol", "diesel", "hybrid", "phev", "electric", "lpg"],
  transmission: ["automatic", "manual", "cvt", "dct"],
  drivetrain: ["fwd", "rwd", "awd", "four_wd"],
  condition: ["used", "cpo", "demo"],
};

/**
 * Canonical values with no mapping for this channel.
 *
 * Returned as `field:value` pairs. An empty array means the channel can handle
 * anything the schema allows — including values no live vehicle uses yet, which
 * is the point: the first electric car listed must not be the thing that
 * discovers the gap.
 */
export function findUnmappedValues(
  enumMap: EnumMap,
  fields: readonly string[] = Object.keys(CANONICAL_ENUM_VALUES),
): { field: string; value: string }[] {
  const gaps: { field: string; value: string }[] = [];
  for (const field of fields) {
    for (const value of CANONICAL_ENUM_VALUES[field] ?? []) {
      if (!enumMap.has(key(field, value))) gaps.push({ field, value });
    }
  }
  return gaps;
}
