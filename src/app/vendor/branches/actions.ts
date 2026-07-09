"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVendorContext, ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { getBranchLimit, getOrganizationPlanCode } from "@/lib/plan-features";
import { requireUser } from "@/lib/security/auth";
import { uniqueSlug } from "@/lib/slug";
import { branchSchema } from "@/lib/validation/schemas";
import { invalidatePseo } from "@/lib/seo/invalidate";

export async function createBranch(prevState: any, formData: FormData) {
  const user = await requireUser();
  const payloadResult = branchSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    city: formData.get("city"),
    state: formData.get("state"),
    address: formData.get("address"),
    phone: formData.get("phone") || "",
    whatsapp: formData.get("whatsapp") || "",
  });

  if (!payloadResult.success) {
    return { error: "Invalid form data. Please check your inputs." };
  }
  
  const payload = payloadResult.data;

  try {
    await ensureUserCanManageOrganization(user.id, payload.organizationId);

    const supabase = createAdminClient();
    const planCode = await getOrganizationPlanCode(payload.organizationId);
    const branchLimit = getBranchLimit(planCode);

    if (branchLimit !== null) {
      const { count } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", payload.organizationId);

      if ((count ?? 0) >= branchLimit) {
        return { error: `Your ${planCode ?? "current"} plan allows up to ${branchLimit} branch(es). Please upgrade to add more.` };
      }
    }

    const { error } = await supabase.from("branches").insert({
      organization_id: payload.organizationId,
      name: payload.name,
      slug: uniqueSlug(`${payload.name} ${payload.city}`),
      city: payload.city,
      state: payload.state,
      address: payload.address,
      phone: payload.phone || null,
      whatsapp: payload.whatsapp || null,
      status: "pending",
    });

    if (error) {
      return { error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_created",
      resource_type: "organization",
      resource_id: payload.organizationId,
      metadata: { name: payload.name, city: payload.city },
    });

    revalidatePath("/vendor/branches");
    await invalidatePseo({ city: payload.city });
    
    return { error: null, success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create branch." };
  }
}

export async function getCurrentVendorContext() {
  const user = await requireUser();
  return getVendorContext(user.id);
}

export async function updateBranch(prevState: any, formData: FormData) {
  const user = await requireUser();
  const branchId = formData.get("id") as string;
  const organizationId = formData.get("organizationId") as string;
  
  const payloadResult = branchSchema.safeParse({
    organizationId,
    name: formData.get("name"),
    city: formData.get("city"),
    state: formData.get("state"),
    address: formData.get("address"),
    phone: formData.get("phone") || "",
    whatsapp: formData.get("whatsapp") || "",
  });

  if (!payloadResult.success) {
    return { error: "Invalid form data. Please check your inputs." };
  }
  
  const payload = payloadResult.data;

  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("branches")
      .update({
        name: payload.name,
        city: payload.city,
        state: payload.state,
        address: payload.address,
        phone: payload.phone || null,
        whatsapp: payload.whatsapp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .eq("organization_id", organizationId);

    if (error) {
      return { error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_updated",
      resource_type: "organization",
      resource_id: organizationId,
      metadata: { branch_id: branchId, name: payload.name, city: payload.city },
    });

    revalidatePath("/vendor/branches");
    await invalidatePseo({ city: payload.city });
    
    return { error: null, success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update branch." };
  }
}

export async function deleteBranch(branchId: string, organizationId: string) {
  const user = await requireUser();
  
  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branchId)
      .eq("organization_id", organizationId);

    if (error) {
      if (error.code === '23503') {
        throw new Error("Cannot delete branch because it has vehicles assigned to it. Please reassign or delete the vehicles first.");
      }
      throw new Error(error.message);
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_deleted",
      resource_type: "organization",
      resource_id: organizationId,
      metadata: { branch_id: branchId },
    });

    revalidatePath("/vendor/branches");
    return { success: true };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to delete branch.");
  }
}
