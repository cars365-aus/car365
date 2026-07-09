import { describe, it, expect } from "vitest";
import { toFriendlyAuthError, FRIENDLY_AUTH_MESSAGES } from "./errors";

describe("toFriendlyAuthError", () => {
  it("maps invalid credentials errors", () => {
    expect(toFriendlyAuthError({ code: "invalid_credentials" })).toBe(FRIENDLY_AUTH_MESSAGES.invalidCredentials);
    expect(toFriendlyAuthError("Invalid login credentials")).toBe(FRIENDLY_AUTH_MESSAGES.invalidCredentials);
  });

  it("maps email not confirmed errors", () => {
    expect(toFriendlyAuthError({ code: "email_not_confirmed" })).toBe(FRIENDLY_AUTH_MESSAGES.emailNotConfirmed);
    expect(toFriendlyAuthError("Please confirm your email")).toBe(FRIENDLY_AUTH_MESSAGES.emailNotConfirmed);
  });

  it("maps invalid OTP errors", () => {
    expect(toFriendlyAuthError({ code: "otp_expired" })).toBe(FRIENDLY_AUTH_MESSAGES.invalidOtp);
    expect(toFriendlyAuthError({ code: "otp_disabled" })).toBe(FRIENDLY_AUTH_MESSAGES.invalidOtp);
    expect(toFriendlyAuthError("Token has expired")).toBe(FRIENDLY_AUTH_MESSAGES.invalidOtp);
  });

  it("maps rate limiting errors", () => {
    expect(toFriendlyAuthError({ code: "over_request_rate_limit" })).toBe(FRIENDLY_AUTH_MESSAGES.rateLimited);
    expect(toFriendlyAuthError({ status: 429 })).toBe(FRIENDLY_AUTH_MESSAGES.rateLimited);
    expect(toFriendlyAuthError("Too many requests")).toBe(FRIENDLY_AUTH_MESSAGES.rateLimited);
  });

  it("maps phone/SMS provider unavailable errors", () => {
    expect(toFriendlyAuthError({ code: "sms_send_failed" })).toBe(FRIENDLY_AUTH_MESSAGES.phoneUnavailable);
    expect(toFriendlyAuthError({ code: "phone_provider_disabled" })).toBe(FRIENDLY_AUTH_MESSAGES.phoneUnavailable);
    expect(toFriendlyAuthError("Error sending sms")).toBe(FRIENDLY_AUTH_MESSAGES.phoneUnavailable);
  });

  it("falls back to generic error for unclassified input", () => {
    expect(toFriendlyAuthError({ code: "unknown_error" })).toBe(FRIENDLY_AUTH_MESSAGES.generic);
    expect(toFriendlyAuthError("Something completely different")).toBe(FRIENDLY_AUTH_MESSAGES.generic);
    expect(toFriendlyAuthError(null)).toBe(FRIENDLY_AUTH_MESSAGES.generic);
    expect(toFriendlyAuthError(undefined)).toBe(FRIENDLY_AUTH_MESSAGES.generic);
    expect(toFriendlyAuthError(123)).toBe(FRIENDLY_AUTH_MESSAGES.generic);
  });
});
