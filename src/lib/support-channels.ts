import type { PlanCode } from "@/lib/types";

export type SupportChannel =
  | "email"
  | "priorityEmail"
  | "phone"
  | "dedicatedPhone"
  | "accountManager"
  | "sameDayResponse";

export interface SupportConfig {
  channels: SupportChannel[];
  label: string;
}

const SUPPORT_BY_PLAN: Record<PlanCode, SupportConfig> = {
  starter: {
    channels: ["email"],
    label: "Email support",
  },
  growth: {
    channels: ["priorityEmail", "phone"],
    label: "Priority email + Phone support",
  },
  pro: {
    channels: ["priorityEmail", "dedicatedPhone", "accountManager", "sameDayResponse"],
    label: "Dedicated Phone, Priority Email, Account Manager, Same-Day Response",
  },
};

/**
 * Returns the support configuration for a given plan code.
 * Falls back to starter-level support if plan is null/undefined
 * or subscription is not active/trialing.
 */
export function getSupportConfig(
  planCode: string | null | undefined,
  subscriptionStatus?: string,
): SupportConfig {
  if (
    !planCode ||
    (subscriptionStatus && !["active", "trialing"].includes(subscriptionStatus))
  ) {
    return SUPPORT_BY_PLAN.starter;
  }
  return SUPPORT_BY_PLAN[planCode as PlanCode] ?? SUPPORT_BY_PLAN.starter;
}

/**
 * Returns a human-readable support tier label for a given plan code.
 */
export function getSupportTierLabel(planCode: string | null | undefined): string {
  return getSupportConfig(planCode).label;
}
