/**
 * Shared, pure authentication input validators.
 *
 * These functions are used by the email and phone auth forms (and any other
 * surface) to validate user input *before* any Supabase call is made. They are
 * pure and total: they never throw and never perform side effects, returning a
 * structured {@link ValidationResult} the UI can map directly to field text.
 *
 * Requirements: 2.2, 2.3, 2.4, 4.2, 7.7, 8.6, 10.3
 */

/**
 * Discriminated result of a validation check. On failure, `message` is a
 * human-readable string suitable for display next to the relevant field.
 */
export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Password policy constants (documented)
// ---------------------------------------------------------------------------

/**
 * Password policy.
 *
 * A valid password must:
 * - be at least {@link PASSWORD_POLICY.minLength} characters long, and
 * - at most {@link PASSWORD_POLICY.maxLength} characters long, and
 * - contain at least one letter (composition), and
 * - contain at least one digit (composition).
 *
 * The maximum length is a defensive upper bound aligned with the bcrypt-based
 * hashing Supabase Auth performs server-side; credential verification and
 * storage remain entirely delegated to Supabase Auth.
 */
export const PASSWORD_POLICY = {
  /** Minimum number of characters required. */
  minLength: 12,
  /** Maximum number of characters accepted. */
  maxLength: 72,
  /** A valid password must contain at least one letter. */
  requireLetter: true,
  /** A valid password must contain at least one digit. */
  requireDigit: true,
} as const;

/**
 * Phone (E.164) policy.
 *
 * A valid number is a leading `+`, a first digit in 1–9, and a total of
 * {@link PHONE_POLICY.minDigits}–{@link PHONE_POLICY.maxDigits} digits.
 */
export const PHONE_POLICY = {
  /** Minimum number of digits (excluding the leading `+`). */
  minDigits: 8,
  /** Maximum number of digits (excluding the leading `+`), per E.164. */
  maxDigits: 15,
} as const;

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validates an email address using a pragmatic structural check.
 *
 * Accepts a string (after trimming) when it has a non-empty local part, a
 * single `@`, a domain containing at least one dot, and no internal
 * whitespace. Rejects everything else with a message.
 *
 * Requirements: 2.3, 8.6, 10.3
 */
export function validateEmail(input: string): ValidationResult {
  const value = input.trim();

  if (value.length === 0) {
    return { ok: false, message: "Email is required." };
  }
  if (/\s/.test(value)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const atParts = value.split("@");
  if (atParts.length !== 2) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const [localPart, domain] = atParts;
  if (localPart.length === 0) {
    return { ok: false, message: "Enter a valid email address." };
  }
  // Domain must contain a dot, with non-empty labels on both sides.
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  return { ok: true };
}

/**
 * Validates a password against {@link PASSWORD_POLICY}.
 *
 * Requirements: 2.4, 8.6, 10.3
 */
export function validatePassword(input: string): ValidationResult {
  if (input.length < PASSWORD_POLICY.minLength) {
    return {
      ok: false,
      message: `Password must be at least ${PASSWORD_POLICY.minLength} characters long.`,
    };
  }
  if (input.length > PASSWORD_POLICY.maxLength) {
    return {
      ok: false,
      message: `Password must be at most ${PASSWORD_POLICY.maxLength} characters long.`,
    };
  }
  if (PASSWORD_POLICY.requireLetter && !/[a-zA-Z]/.test(input)) {
    return {
      ok: false,
      message: "Password must include at least one letter.",
    };
  }
  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(input)) {
    return {
      ok: false,
      message: "Password must include at least one number.",
    };
  }

  return { ok: true };
}

/**
 * Validates that a password and its confirmation match exactly.
 *
 * Requirements: 2.2, 8.6, 10.3
 */
export function validatePasswordConfirmation(
  password: string,
  confirm: string,
): ValidationResult {
  if (password !== confirm) {
    return { ok: false, message: "Passwords do not match." };
  }
  return { ok: true };
}

/**
 * Validates a phone number in E.164 international format against
 * {@link PHONE_POLICY}: a leading `+`, a first digit 1–9, and 8–15 digits
 * total.
 *
 * Requirements: 4.2, 8.6, 10.3
 */
export function validatePhone(input: string): ValidationResult {
  const value = input.trim();

  const e164 = new RegExp(
    `^\\+[1-9][0-9]{${PHONE_POLICY.minDigits - 1},${PHONE_POLICY.maxDigits - 1}}$`,
  );

  if (!e164.test(value)) {
    return {
      ok: false,
      message:
        "Enter a phone number in international format, e.g. +14155552671.",
    };
  }

  return { ok: true };
}
