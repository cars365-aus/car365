import { describe, it, expect, afterEach } from "vitest";
import { getAdminEmailAllowlist, isAllowlistedAdminEmail } from "./admin-allowlist";

const ENV_KEY = "ADMIN_EMAIL_ALLOWLIST";
const original = process.env[ENV_KEY];

afterEach(() => {
  if (original === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = original;
  }
});

describe("admin-allowlist", () => {
  it("returns an empty list when the env var is unset", () => {
    delete process.env[ENV_KEY];
    expect(getAdminEmailAllowlist()).toEqual([]);
    expect(isAllowlistedAdminEmail("anyone@example.com")).toBe(false);
  });

  it("parses a comma-separated list, trimming and lowercasing", () => {
    process.env[ENV_KEY] = " Alice@Example.com , bob@example.com ";
    expect(getAdminEmailAllowlist()).toEqual([
      "alice@example.com",
      "bob@example.com",
    ]);
  });

  it("ignores empty entries from stray commas", () => {
    process.env[ENV_KEY] = "a@example.com,,b@example.com,";
    expect(getAdminEmailAllowlist()).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("matches emails case-insensitively", () => {
    process.env[ENV_KEY] = "admin@example.com";
    expect(isAllowlistedAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAllowlistedAdminEmail("  admin@example.com  ")).toBe(true);
    expect(isAllowlistedAdminEmail("other@example.com")).toBe(false);
  });

  it("returns false for null/undefined/empty email input", () => {
    process.env[ENV_KEY] = "admin@example.com";
    expect(isAllowlistedAdminEmail(null)).toBe(false);
    expect(isAllowlistedAdminEmail(undefined)).toBe(false);
    expect(isAllowlistedAdminEmail("")).toBe(false);
  });
});
