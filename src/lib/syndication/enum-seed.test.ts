import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEnumMap, findUnmappedValues, CANONICAL_ENUM_VALUES } from "./enum-map";

/**
 * Asserts that migration 0015 seeds a channel mapping for EVERY canonical enum
 * value, not merely the values live inventory happens to contain today.
 *
 * Without this, a gap is invisible until the day someone lists the first
 * electric car or convertible — and then it fails at publish time, on a real
 * customer's vehicle, with an UNMAPPED_ENUM rejection. Catching it in CI turns
 * a production incident into a failing test.
 *
 * Parsing the migration is deliberate: the seed rows are the artefact that
 * actually reaches the database, so testing a TypeScript copy of them would
 * prove nothing about what gets deployed.
 */

const MIGRATION = resolve(process.cwd(), "supabase/migrations/0015_syndication_channels.sql");

/** Extracts `(channel, field, value, channel_value)` tuples from the seed INSERT. */
function parseSeededMappings(sql: string): { channel: string; field: string; value: string }[] {
  const rows: { channel: string; field: string; value: string }[] = [];
  // Matches: ('google_vehicle_ads', 'body_type', 'sedan', 'Sedan')
  const pattern = /\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'\s*,\s*'([^']+)'\s*\)/g;
  for (const match of sql.matchAll(pattern)) {
    const [, channel, field, value] = match;
    // Only tuples whose field is a known canonical enum field are mappings;
    // this skips the `channel` table's own seed rows.
    if (field in CANONICAL_ENUM_VALUES) rows.push({ channel, field, value });
  }
  return rows;
}

const sql = readFileSync(MIGRATION, "utf8");
const seeded = parseSeededMappings(sql);

/** Channels the migration is expected to fully map. */
const SEEDED_CHANNELS = ["google_vehicle_ads", "meta_marketplace"] as const;

describe("migration 0015 enum seed", () => {
  it("parses seed rows out of the migration", () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  it.each(SEEDED_CHANNELS)("covers every canonical enum value for %s", (channel) => {
    const map = buildEnumMap(
      seeded
        .filter((r) => r.channel === channel)
        .map((r) => ({ canonicalField: r.field, canonicalValue: r.value, channelValue: "x" })),
    );

    const gaps = findUnmappedValues(map);
    expect(
      gaps,
      `Missing channel_enum_map seed rows for ${channel}: ` +
        gaps.map((g) => `${g.field}=${g.value}`).join(", "),
    ).toEqual([]);
  });

  it("seeds no mapping for a canonical value that does not exist in the schema", () => {
    // A typo'd seed row is dead weight that silently never matches.
    for (const row of seeded) {
      const allowed = CANONICAL_ENUM_VALUES[row.field];
      expect(allowed, `unknown canonical field "${row.field}"`).toBeDefined();
      expect(allowed).toContain(row.value);
    }
  });

  it("does not seed any channel as enabled", () => {
    // Applying the migration must never start publishing. Channels are turned
    // on deliberately, after their connection is proven.
    expect(sql).not.toMatch(/insert into public\.channel\b[\s\S]*?,\s*true\s*,\s*'\{/);
  });
});
