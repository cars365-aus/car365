"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import { uniqueSlug } from "@/lib/slug";
import { onboardingSchema } from "@/lib/validation/schemas";

type OnboardingActionResult = {
  error?: string;
};

type VendorOnboardingInput = {
  userId: string;
  email: string;
  businessName: string;
  abn: string;
  website: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  organizationSlug: string;
  branchSlug: string;
};

function isMissingOnboardingRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.includes("Could not find the function public.create_vendor_onboarding")
  );
}

async function createVendorOnboardingRecords(
  supabase: ReturnType<typeof createAdminClient>,
  input: VendorOnboardingInput,
) {
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: input.businessName,
      slug: input.organizationSlug,
      abn: input.abn,
      billing_email: input.email,
      website: input.website || null,
      phone: input.phone,
      address: input.address,
      status: "pending",
    })
    .select("id")
    .single();

  if (organizationError || !organization) {
    return {
      error: organizationError?.message ?? "Unable to create organization",
    };
  }

  const organizationId = organization.id;

  const dependentWrites = [
    supabase.from("organization_members").insert({
      organization_id: organizationId,
      user_id: input.userId,
      role: "owner",
    }),
    supabase.from("branches").insert({
      organization_id: organizationId,
      name: `${input.city} branch`,
      slug: input.branchSlug,
      city: input.city,
      state: input.state,
      address: input.address,
      phone: input.phone,
      status: "pending",
    }),
    supabase.from("legal_acceptances").insert({
      organization_id: organizationId,
      user_id: input.userId,
      document_slug: "vendor-agreement",
      version: "vendor-agreement-v1",
    }),
    supabase.from("audit_logs").insert({
      actor_user_id: input.userId,
      action: "vendor_onboarding_submitted",
      resource_type: "organization",
      resource_id: organizationId,
      metadata: { source: "vendor_onboarding_service_role_fallback" },
    }),
  ];

  const results = await Promise.all(dependentWrites);
  const failedWrite = results.find((result) => result.error);

  if (failedWrite?.error) {
    await supabase.from("organizations").delete().eq("id", organizationId);
    return { error: failedWrite.error.message };
  }

  return { organizationId };
}

export async function submitVendorOnboarding(formData: FormData): Promise<OnboardingActionResult> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    abn: formData.get("abn"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
    address: formData.get("address"),
    website: formData.get("website") || "",
    acceptedAgreement: formData.get("acceptedAgreement") === "on",
  });

  if (!parsed.success) {
    return { error: "Please check the onboarding form and try again." };
  }

  const payload = parsed.data;
  const supabase = createAdminClient();

  // Update profile (can be done independently - not part of the atomic transaction)
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: payload.contactName,
    email: user.email,
    phone: payload.phone,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Vendor onboarding profile update failed:", profileError);
    return { error: "Unable to update your profile. Please try again." };
  }

  // Use atomic database function for all onboarding writes
  // This ensures organization, member, branch, legal acceptance, and audit log are all created together
  const organizationSlug = uniqueSlug(payload.businessName);
  const branchSlug = uniqueSlug(`${payload.businessName} ${payload.city}`);
  const { error: onboardingError } = await supabase.rpc(
    "create_vendor_onboarding",
    {
      p_user_id: user.id,
      p_full_name: payload.contactName,
      p_email: user.email ?? "",
      p_phone: payload.phone,
      p_business_name: payload.businessName,
      p_slug: organizationSlug,
      p_abn: payload.abn,
      p_website: payload.website ?? "",
      p_address: payload.address,
      p_city: payload.city,
      p_state: payload.state,
      p_branch_slug: branchSlug,
    },
  );

  if (onboardingError) {
    console.error("Vendor onboarding RPC failed:", onboardingError);

    if (!isMissingOnboardingRpc(onboardingError)) {
      return { error: "Vendor onboarding failed. Please try again." };
    }

    const fallback = await createVendorOnboardingRecords(supabase, {
      userId: user.id,
      email: user.email ?? "",
      businessName: payload.businessName,
      abn: payload.abn,
      website: payload.website ?? "",
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      organizationSlug,
      branchSlug,
    });

    if (fallback.error) {
      console.error("Vendor onboarding fallback failed:", fallback.error);
      return { error: "Vendor onboarding failed. Please try again." };
    }
  }

  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/branches");

  const plan = formData.get("plan");
  const planParam =
    plan && typeof plan === "string" && ["starter", "growth", "pro"].includes(plan)
      ? plan
      : "starter";

  redirect(`/vendor/billing?plan=${planParam}`);
}
