/**
 * Friendly, sanitized mapping for Supabase authentication errors.
 *
 * All three auth methods (Google OAuth, email/password, phone OTP) funnel their
 * failures through {@link toFriendlyAuthError}. The goal is to present a short,
 * human-readable message to the user while guaranteeing that no raw Supabase
 * payload, stack trace, status code, or internal identifier ever reaches the UI.
 *
 * Requirements: 2.8, 3.4, 3.5, 4.8, 8.5
 */

/** User-safe messages. Kept as constants so the UI and tests can reference them. */
export const FRIENDLY_AUTH_MESSAGES = {
  /** Wrong email/password — deliberately does not reveal whether the email exists. */
  invalidCredentials: "Invalid email or password.",
  /** SMS/phone provider not configured or unavailable. */
  phoneUnavailable: "Phone sign-in is temporarily unavailable. Please try again later.",
  /** A submitted one-time code was wrong or expired. */
  invalidOtp: "That code is invalid or has expired. Please request a new code.",
  /** Email confirmation step has not been completed yet. */
  emailNotConfirmed: "Please confirm your email address before signing in.",
  /** Too many attempts in a short window. */
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  /** Catch-all used whenever the error cannot be classified. */
  generic: "Something went wrong. Please try again.",
} as const;

/**
 * The minimal, structurally-typed shape we read from a Supabase auth error.
 * We never read or surface anything beyond these classification hints.
 */
interface AuthErrorShape {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
}

function readErrorShape(error: unknown): AuthErrorShape {
  if (typeof error === "object" && error !== null) {
    return error as AuthErrorShape;
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return {};
}

function asLowerString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

/**
 * Maps an arbitrary Supabase auth error into a sanitized, user-safe string.
 *
 * Classification is based only on well-known Supabase error codes and on coarse
 * keyword hints in the message. The original message text is NEVER returned —
 * every branch resolves to one of the curated {@link FRIENDLY_AUTH_MESSAGES}.
 */
export function toFriendlyAuthError(error: unknown): string {
  const shape = readErrorShape(error);
  const code = asLowerString(shape.code);
  const message = asLowerString(shape.message);

  // Invalid login credentials (do not disclose whether the account exists).
  if (
    code === "invalid_credentials" ||
    code === "invalid_login_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return FRIENDLY_AUTH_MESSAGES.invalidCredentials;
  }

  // Email confirmation required / not yet confirmed.
  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("confirm your email")
  ) {
    return FRIENDLY_AUTH_MESSAGES.emailNotConfirmed;
  }

  // Invalid or expired one-time code.
  if (
    code === "otp_expired" ||
    code === "otp_disabled" ||
    message.includes("token has expired") ||
    message.includes("invalid otp") ||
    message.includes("invalid token") ||
    message.includes("expired")
  ) {
    return FRIENDLY_AUTH_MESSAGES.invalidOtp;
  }

  // Rate limiting.
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    code === "over_sms_send_rate_limit" ||
    shape.status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return FRIENDLY_AUTH_MESSAGES.rateLimited;
  }

  // SMS / phone provider not configured or otherwise unavailable.
  if (
    code === "sms_send_failed" ||
    code === "phone_provider_disabled" ||
    code === "provider_disabled" ||
    code === "unsupported_otp_type" ||
    message.includes("sms") ||
    message.includes("phone provider") ||
    message.includes("error sending confirmation otp") ||
    message.includes("error sending sms") ||
    message.includes("phone") ||
    message.includes("twilio") ||
    message.includes("messagebird")
  ) {
    return FRIENDLY_AUTH_MESSAGES.phoneUnavailable;
  }

  // Anything we cannot classify falls back to a safe generic message.
  return FRIENDLY_AUTH_MESSAGES.generic;
}
