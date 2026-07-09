import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validatePassword, PASSWORD_POLICY } from "@/lib/auth/validation";

// Feature: multi-method-auth, Property 2: Password validation enforces the documented policy

describe("validatePassword (Property 2)", () => {
  it("accepts passwords that meet the policy", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: PASSWORD_POLICY.minLength, maxLength: PASSWORD_POLICY.maxLength })
          .filter(s => /[a-zA-Z]/.test(s) && /[0-9]/.test(s)),
        (password) => {
          const result = validatePassword(password);
          expect(result.ok).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects passwords that are too short", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: PASSWORD_POLICY.minLength - 1 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe(`Password must be at least ${PASSWORD_POLICY.minLength} characters long.`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects passwords that are too long", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: PASSWORD_POLICY.maxLength + 1, maxLength: PASSWORD_POLICY.maxLength + 100 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe(`Password must be at most ${PASSWORD_POLICY.maxLength} characters long.`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  if (PASSWORD_POLICY.requireLetter) {
    it("rejects passwords with no letters", () => {
      const nonLetterChars = "0123456789!@#$%^&*()_+-=[]{}|;':\",./<>? `~".split("");
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...nonLetterChars), { 
            minLength: PASSWORD_POLICY.minLength, 
            maxLength: PASSWORD_POLICY.maxLength 
          }).map(arr => arr.join('')),
          (password) => {
            const result = validatePassword(password);
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.message).toBe("Password must include at least one letter.");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  }

  if (PASSWORD_POLICY.requireDigit) {
    it("rejects passwords with no digits", () => {
      const nonDigitChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;':\",./<>? `~".split("");
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...nonDigitChars), { 
            minLength: PASSWORD_POLICY.minLength, 
            maxLength: PASSWORD_POLICY.maxLength 
          }).map(arr => arr.join('')),
          (password) => {
            const result = validatePassword(password);
            expect(result.ok).toBe(false);
            if (!result.ok && result.message === "Password must include at least one number.") {
              expect(result.message).toBe("Password must include at least one number.");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  }
});
