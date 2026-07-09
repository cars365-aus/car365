"use server";

import { generateVehicleAutofill } from "@/lib/ai/vehicle-seo";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { organizationHasFeature } from "@/lib/plan-features";
import { requireUser } from "@/lib/security/auth";

export type VehicleAutofillResult =
  | {
      ok: true;
      data: {
        title: string;
        category: string;
        transmission: string;
        fuel: string;
        seats: number;
        description: string;
      };
    }
  | { ok: false; error: string };

export async function getVehicleAutofill(input: {
  organizationId: string;
  make: string;
  model: string;
  year: number;
}): Promise<VehicleAutofillResult> {
  try {
    const user = await requireUser();
    await ensureUserCanManageOrganization(user.id, input.organizationId);

    const hasFeature = await organizationHasFeature(input.organizationId, "aiSeoContent");
    if (!hasFeature) {
      return {
        ok: false,
        error: "Your current plan does not include AI autofill. Please upgrade to Pro.",
      };
    }

    const make = input.make.trim().substring(0, 50);
    const model = input.model.trim().substring(0, 50);
    const year = Math.max(1950, Math.min(new Date().getFullYear() + 2, input.year));

    if (!make || !model) {
      return { ok: false, error: "Make and model are required for AI generation." };
    }

    const data = await generateVehicleAutofill({ make, model, year });
    return { ok: true, data };
  } catch (err) {
    console.error("[getVehicleAutofill]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AI generation failed. Please try again.",
    };
  }
}
