import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validatePhone, PHONE_POLICY } from "@/lib/auth/validation";

// Feature: multi-method-auth, Property 4: Phone validation accepts only E.164 international format

describe("validatePhone (Property 4)", () => {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  
  const digitStringArb = (minLength: number, maxLength: number) => 
    fc.array(fc.constantFrom(...digits), { minLength, maxLength }).map(arr => arr.join(''));

  const e164ValidArb = fc.tuple(
    fc.constant("+"),
    fc.integer({ min: 1, max: 9 }).map(String),
    digitStringArb(PHONE_POLICY.minDigits - 1, PHONE_POLICY.maxDigits - 1)
  ).map(([plus, firstDigit, rest]) => `${plus}${firstDigit}${rest}`);

  it("accepts valid E.164 phone numbers", () => {
    fc.assert(
      fc.property(
        e164ValidArb,
        (phone) => {
          const result = validatePhone(phone);
          expect(result.ok).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects phone numbers without a leading +", () => {
    fc.assert(
      fc.property(
        e164ValidArb,
        (phone) => {
          const invalidPhone = phone.substring(1); // remove '+'
          const result = validatePhone(invalidPhone);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.message).toBe("Enter a phone number in international format, e.g. +14155552671.");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects phone numbers with a leading + followed by 0", () => {
    fc.assert(
      fc.property(
        digitStringArb(PHONE_POLICY.minDigits - 1, PHONE_POLICY.maxDigits - 1),
        (rest) => {
          const invalidPhone = `+0${rest}`;
          const result = validatePhone(invalidPhone);
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects phone numbers that are too short", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant("+"),
          fc.integer({ min: 1, max: 9 }).map(String),
          digitStringArb(0, PHONE_POLICY.minDigits - 2)
        ).map(([plus, firstDigit, rest]) => `${plus}${firstDigit}${rest}`),
        (invalidPhone) => {
          const result = validatePhone(invalidPhone);
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects phone numbers that are too long", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant("+"),
          fc.integer({ min: 1, max: 9 }).map(String),
          digitStringArb(PHONE_POLICY.maxDigits, PHONE_POLICY.maxDigits + 10)
        ).map(([plus, firstDigit, rest]) => `${plus}${firstDigit}${rest}`),
        (invalidPhone) => {
          const result = validatePhone(invalidPhone);
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects phone numbers containing non-digits (other than leading +)", () => {
    fc.assert(
      fc.property(
        e164ValidArb,
        fc.constantFrom(" ", "-", "(", ")", "a", "."),
        fc.integer({ min: 2 }),
        (phone, invalidChar, pos) => {
          const insertPos = Math.min(pos, phone.length - 1);
          const invalidPhone = phone.slice(0, insertPos) + invalidChar + phone.slice(insertPos);
          const result = validatePhone(invalidPhone);
          expect(result.ok).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
