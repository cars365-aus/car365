export type ModerationResourceType = "vendor" | "branch" | "vehicle" | "review" | "fraud_flag";
export type ModerationAction = "approve" | "reject" | "suspend" | "restore" | "verify";

export const moderationTableMap: Record<ModerationResourceType, string> = {
  vendor: "organizations",
  branch: "branches",
  vehicle: "vehicles",
  review: "reviews",
  fraud_flag: "fraud_flags",
};

const statusMap: Record<ModerationAction, string> = {
  approve: "approved",
  reject: "rejected",
  suspend: "suspended",
  restore: "approved",
  verify: "approved",
};

const allowedActions: Record<ModerationResourceType, ModerationAction[]> = {
  vendor: ["approve", "reject", "suspend", "restore", "verify"],
  branch: ["approve", "reject", "suspend", "restore", "verify"],
  vehicle: ["approve", "reject", "suspend", "restore", "verify"],
  review: ["approve", "reject", "restore"],
  fraud_flag: ["approve", "reject", "restore"],
};

const hasUpdatedAt = new Set<ModerationResourceType>(["vendor", "branch", "vehicle"]);
const hasSuspendedAt = new Set<ModerationResourceType>(["vendor", "vehicle"]);

export function isModerationActionAllowed(
  resourceType: ModerationResourceType,
  action: ModerationAction,
) {
  return allowedActions[resourceType].includes(action);
}

export function buildModerationUpdate(
  resourceType: Exclude<ModerationResourceType, "fraud_flag">,
  action: ModerationAction,
  timestamp = new Date().toISOString(),
) {
  if (!isModerationActionAllowed(resourceType, action)) {
    return null;
  }

  const updateData: Record<string, unknown> = {
    status: statusMap[action],
  };

  if (hasUpdatedAt.has(resourceType)) {
    updateData.updated_at = timestamp;
  }

  if (action === "suspend" && hasSuspendedAt.has(resourceType)) {
    updateData.suspended_at = timestamp;
  }

  if (action === "restore" && hasSuspendedAt.has(resourceType)) {
    updateData.suspended_at = null;
  }

  return updateData;
}

export function getFraudFlagModerationStatus(action: ModerationAction) {
  if (!isModerationActionAllowed("fraud_flag", action)) {
    return null;
  }

  return action === "restore" ? "open" : "closed";
}
