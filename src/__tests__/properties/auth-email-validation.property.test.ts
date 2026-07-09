import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateEmail } from "@/lib/auth/validation";

// Feature: multi-method-auth, Property 1: Email validation accepts well-formed and rejects malformed addresses

describe("validateEmail (Property 1)", () => {
  it("accepts well-formed email addresses", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@|\./.test(s)),
        fc.string({ minLength: 2, maxLength: 10 }).filter(s => !/\s|@|\./.test(s)),
        (local, domainPart, tld) => {
          const email = `${local}@${domainPart}.${tld}`;
          const result = validateEmail(email);
          expect(result.ok).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects emails with no @ symbol", () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@') && s.trim().length > 0),
        (input) => {
          const result = validateEmail(input);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Enter a valid email address.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects emails with whitespace", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@|\./.test(s)),
        fc.string({ minLength: 2, maxLength: 10 }).filter(s => !/\s|@|\./.test(s)),
        fc.constantFrom(" ", "\t", "\n"),
        (local, domainPart, tld, space) => {
          const email = `${local}${space}@${domainPart}.${tld}`;
          const result = validateEmail(email);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Enter a valid email address.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects domains with no dot", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/\s|@|\./.test(s)),
        (local, domain) => {
          const email = `${local}@${domain}`;
          const result = validateEmail(email);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Enter a valid email address.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects empty or whitespace-only inputs", () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === ""),
        (input) => {
          const result = validateEmail(input);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Email is required.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
