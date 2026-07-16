import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveProfileFromUser } from "@/lib/auth/profile";
import type { User } from "@supabase/supabase-js";

// Feature: multi-method-auth, Property 5: Profile derivation is total and null-safe across all user shapes

describe("deriveProfileFromUser (Property 5)", () => {
  // fast-check v4 removed the `withDeletedKeys` option; `requiredKeys: []`
  // is the modern equivalent (every key is optional and may be absent).
  const userMetadataArb = fc.record({
    full_name: fc.option(fc.string(), { nil: undefined }),
    name: fc.option(fc.string(), { nil: undefined }),
  }, { requiredKeys: [] });

  const userArb = fc.record({
    id: fc.uuid(),
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    phone: fc.option(fc.string(), { nil: undefined }),
    user_metadata: fc.option(userMetadataArb, { nil: undefined }),
  }, { requiredKeys: [] }).map(u => u as unknown as User);

  it("derives a valid ProfileUpsert payload without throwing for any user shape", () => {
    fc.assert(
      fc.property(
        userArb,
        (user) => {
          const profile = deriveProfileFromUser(user);

          expect(profile.id).toBe(user.id);
          expect(profile.email).toBe(user.email ?? null);
          expect(profile.phone).toBe(user.phone ?? null);

          const meta = user.user_metadata || {};
          expect(profile.full_name).toBe(meta.full_name ?? meta.name ?? null);

          // updated_at should be a valid ISO timestamp
          expect(!isNaN(Date.parse(profile.updated_at))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
