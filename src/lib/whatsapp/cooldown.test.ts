import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Force the in-memory fallback path by stubbing getRedisClient to return null,
// so these tests never depend on a configured Redis instance.
vi.mock("@/lib/security/rate-limit-redis", () => ({
  getRedisClient: () => null,
}));

import { shouldAcknowledge } from "./cooldown";

/**
 * Cooldown suppression (Property 4): the first acknowledgement in a window is
 * allowed, repeats within the window are suppressed, and after the window
 * elapses acknowledgement is allowed again.
 *
 * **Validates: Requirements 2.3, 10.3**
 */
describe("shouldAcknowledge (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Unique phone per test to avoid cross-test contamination of the module map.
  let counter = 0;
  function uniquePhone(): string {
    counter += 1;
    return `44700900${counter.toString().padStart(4, "0")}`;
  }

  it("acknowledges the first message from a phone", async () => {
    const phone = uniquePhone();
    expect(await shouldAcknowledge(phone, 60_000)).toBe(true);
  });

  it("suppresses a repeat message within the cooldown window", async () => {
    const phone = uniquePhone();
    expect(await shouldAcknowledge(phone, 60_000)).toBe(true);

    // Advance less than the window: still suppressed.
    vi.advanceTimersByTime(30_000);
    expect(await shouldAcknowledge(phone, 60_000)).toBe(false);
  });

  it("acknowledges again after the cooldown window elapses", async () => {
    const phone = uniquePhone();
    expect(await shouldAcknowledge(phone, 60_000)).toBe(true);

    vi.advanceTimersByTime(30_000);
    expect(await shouldAcknowledge(phone, 60_000)).toBe(false);

    // Cross the window boundary: acknowledgement allowed again.
    vi.advanceTimersByTime(60_000);
    expect(await shouldAcknowledge(phone, 60_000)).toBe(true);
  });

  it("always acknowledges when cooldownMs is 0", async () => {
    const phone = uniquePhone();
    expect(await shouldAcknowledge(phone, 0)).toBe(true);
    expect(await shouldAcknowledge(phone, 0)).toBe(true);
  });
});
