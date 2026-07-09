import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveProfileFromUser } from "@/lib/auth/profile";
import type { User } from "@supabase/supabase-js";

// Feature: multi-method-auth, Property 5: Profile derivation is total and null-safe across all user shapes

describe("deriveProfileFromUser (Property 5)", () => {
  const userMetadataArb = fc.record({
    full_name: fc.option(fc.string(), { nil: undefined }),
    name: fc.option(fc.string(), { nil: undefined }),
    avatar_url: fc.option(fc.webUrl(), { nil: undefined }),
    picture: fc.option(fc.webUrl(), { nil: undefined }),
  }, { withDeletedKeys: true });

  const userArb = fc.record({
    id: fc.uuid(),
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    phone: fc.option(fc.string(), { nil: undefined }),
    user_metadata: fc.option(userMetadataArb, { nil: undefined }),
  }, { withDeletedKeys: true }).map(u => u as User);

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
          expect(profile.avatar_url).toBe(meta.avatar_url ?? meta.picture ?? null);

          // updated_at should be a valid ISO timestamp
          expect(!isNaN(Date.parse(profile.updated_at))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
