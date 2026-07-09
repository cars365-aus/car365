import { describe, expect, it } from "vitest";
import {
  buildModerationUpdate,
  getFraudFlagModerationStatus,
  isModerationActionAllowed,
} from "@/lib/moderation";

describe("moderation rules", () => {
  const timestamp = "2026-06-05T00:00:00.000Z";

  it("does not add nonexistent timestamp columns to review updates", () => {
    expect(buildModerationUpdate("review", "approve", timestamp)).toEqual({
      status: "approved",
    });
  });

  it("tracks suspension timestamps only for resources with suspended_at", () => {
    expect(buildModerationUpdate("vehicle", "suspend", timestamp)).toEqual({
      status: "suspended",
      updated_at: timestamp,
      suspended_at: timestamp,
    });

    expect(buildModerationUpdate("branch", "suspend", timestamp)).toEqual({
      status: "suspended",
      updated_at: timestamp,
    });
  });

  it("rejects invalid resource/action combinations", () => {
    expect(isModerationActionAllowed("review", "suspend")).toBe(false);
    expect(buildModerationUpdate("review", "suspend", timestamp)).toBeNull();
    expect(getFraudFlagModerationStatus("verify")).toBeNull();
  });

  it("maps fraud flag moderation to open and closed states", () => {
    expect(getFraudFlagModerationStatus("approve")).toBe("closed");
    expect(getFraudFlagModerationStatus("reject")).toBe("closed");
    expect(getFraudFlagModerationStatus("restore")).toBe("open");
  });
});
