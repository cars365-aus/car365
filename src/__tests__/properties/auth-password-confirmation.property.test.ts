import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validatePasswordConfirmation } from "@/lib/auth/validation";

// Feature: multi-method-auth, Property 3: Password confirmation matches exactly

describe("validatePasswordConfirmation (Property 3)", () => {
  it("accepts when password and confirm are exactly the same", () => {
    fc.assert(
      fc.property(
        fc.string(),
        (password) => {
          const result = validatePasswordConfirmation(password, password);
          expect(result.ok).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects when password and confirm differ", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (password, confirm) => {
          fc.pre(password !== confirm);
          const result = validatePasswordConfirmation(password, confirm);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Passwords do not match.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
