import type { PlanCode } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanFeature =
  | "directContact"
  | "contactAnalytics"
  | "realtimeLeads"
  | "bulkUpload"
  | "featuredPlacement"
  | "aiSeoContent"
  | "apiAccess"
  | "prioritySupport";

const FEATURES_BY_PLAN: Record<PlanCode, PlanFeature[]> = {
  starter: [],
  growth: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
    "featuredPlacement",
  ],
  pro: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
    "bulkUpload",
    "featuredPlacement",
    "aiSeoContent",
    "apiAccess",
    "prioritySupport",
  ],
};

const BRANCH_LIMITS: Record<PlanCode, number | null> = {
  starter: 1,
  growth: 3,
  pro: null,
};

export function planHasFeature(
  planCode: string | null | undefined,
  feature: PlanFeature,
): boolean {
  if (!planCode) return false;
  const features = FEATURES_BY_PLAN[planCode as PlanCode];
  if (!features) return false;
  return features.includes(feature);
}

export function getBranchLimit(planCode: string | null | undefined): number | null {
  if (!planCode) return 1;
  return BRANCH_LIMITS[planCode as PlanCode] ?? 1;
}

export async function getOrganizationPlanCode(
  organizationId: string,
): Promise<PlanCode | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan_code, status")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return (data?.plan_code as PlanCode) ?? null;
}

export async function organizationHasFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<boolean> {
  const planCode = await getOrganizationPlanCode(organizationId);
  return planHasFeature(planCode, feature);
}

export async function requirePlanFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<void> {
  const allowed = await organizationHasFeature(organizationId, feature);
  if (!allowed) {
    throw new Error(
      `Your current plan does not include this feature. Please upgrade to access it.`,
    );
  }
}

export function getSupportTierLabel(planCode: string | null | undefined): string {
  if (planCode === "pro") return "Dedicated Phone, Priority Email, Account Manager, Same-Day Response";
  if (planCode === "growth") return "Priority email + Phone support";
  return "Email support";
}
