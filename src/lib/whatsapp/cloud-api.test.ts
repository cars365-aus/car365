import crypto from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyMetaSignature } from "./cloud-api";

const APP_SECRET = "test-app-secret";

/** Compute the header value Meta would send for a given body + secret. */
function signBody(body: string, secret: string): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")
  );
}

describe("verifyMetaSignature", () => {
  beforeEach(() => {
    // getWhatsAppEnv requires all WHATSAPP_* vars to be present.
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-access-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "1234567890");
    vi.stubEnv("WHATSAPP_WABA_ID", "waba-id");
    vi.stubEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "verify-token");
    vi.stubEnv("WHATSAPP_APP_SECRET", APP_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for a valid signature", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const signature = signBody(body, APP_SECRET);

    expect(verifyMetaSignature(body, signature)).toBe(true);
  });

  it("returns false for an invalid signature (tampered body)", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const signature = signBody(body, APP_SECRET);
    const tamperedBody = body + " ";

    expect(verifyMetaSignature(tamperedBody, signature)).toBe(false);
  });

  it("returns false for a signature computed with the wrong secret", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const wrongSignature = signBody(body, "wrong-secret");

    expect(verifyMetaSignature(body, wrongSignature)).toBe(false);
  });

  it("returns false when the signature header is missing (null)", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });

    expect(verifyMetaSignature(body, null)).toBe(false);
  });

  it("returns false when the signature header is an empty string", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });

    expect(verifyMetaSignature(body, "")).toBe(false);
  });

  it("returns false for a malformed signature of differing length and never throws", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });

    expect(verifyMetaSignature(body, "sha256=short")).toBe(false);
  });
});
