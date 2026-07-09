import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { resolvePostAuthDestination, isSafeRedirectPath, isValidRedirectForRole, defaultDashboardForRole, type AuthRole } from "@/lib/routing";

// Feature: multi-method-auth, Property 6: Post-login redirect resolution is always safe and consistent across methods

describe("resolvePostAuthDestination (Property 6)", () => {
  const roleArb = fc.constantFrom<AuthRole>("customer", "vendor");
  
  // Safe paths: starts with / but not //
  const validPathArb = (role: AuthRole) => fc.oneof(
    fc.string({ minLength: 1 }).map(s => `/public-${s.replace(/[^a-zA-Z0-9-]/g, "")}`),
    fc.string({ minLength: 1 }).map(s => `/messages/${s.replace(/[^a-zA-Z0-9-]/g, "")}`),
    fc.string({ minLength: 1 }).map(s => `/${role}/${s.replace(/[^a-zA-Z0-9-]/g, "")}`)
  );

  const invalidSafePathArb = (role: AuthRole) => {
    const wrongRole = role === "customer" ? "vendor" : "customer";
    return fc.oneof(
      fc.string({ minLength: 1 }).map(s => `/${wrongRole}/${s.replace(/[^a-zA-Z0-9-]/g, "")}`),
      fc.string({ minLength: 1 }).map(s => `/admin/${s.replace(/[^a-zA-Z0-9-]/g, "")}`)
    );
  };

  // Unsafe paths: absolute URLs or starts with // or contains :
  const unsafePathArb = fc.oneof(
    fc.webUrl(),
    fc.string().map(s => `//${s}`),
    fc.string().map(s => `/\\${s}`),
    fc.string().map(s => `javascript:${s}`)
  );

  const planArb = fc.option(fc.string({ minLength: 1 }), { nil: undefined });

  it("returns the safe next path if it is valid for the role", () => {
    fc.assert(
      fc.property(
        roleArb.chain(role => fc.record({ role: fc.constant(role), next: validPathArb(role) })),
        planArb,
        ({ role, next }, plan) => {
          const result = resolvePostAuthDestination(role, next, plan);
          expect(result).toBe(next);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the fallback dashboard if the next path is safe but invalid for the role", () => {
    fc.assert(
      fc.property(
        roleArb.chain(role => fc.record({ role: fc.constant(role), next: invalidSafePathArb(role) })),
        planArb,
        ({ role, next }, plan) => {
          const result = resolvePostAuthDestination(role, next, plan);
          const fallback = defaultDashboardForRole(role, plan);
          expect(result).toBe(fallback);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the fallback dashboard if the next path is unsafe", () => {
    fc.assert(
      fc.property(
        roleArb,
        unsafePathArb,
        planArb,
        (role, next, plan) => {
          const result = resolvePostAuthDestination(role, next, plan);
          const fallback = defaultDashboardForRole(role, plan);
          expect(result).toBe(fallback);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the fallback dashboard if next path is empty or missing", () => {
    fc.assert(
      fc.property(
        roleArb,
        fc.constantFrom("", null, undefined),
        planArb,
        (role, next, plan) => {
          const result = resolvePostAuthDestination(role, next, plan);
          const fallback = defaultDashboardForRole(role, plan);
          expect(result).toBe(fallback);
        }
      ),
      { numRuns: 100 }
    );
  });
});
