"use server";

import { revalidatePath } from "next/cache";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { requirePlanFeature } from "@/lib/plan-features";
import { generateApiKey } from "@/lib/security/api-key";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createApiKey(organizationId: string, label: string) {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, organizationId);
  await requirePlanFeature(organizationId, "apiAccess");

  const { key, prefix, hash } = generateApiKey();
  const supabase = createAdminClient();

  const { error } = await supabase.from("api_keys").insert({
    organization_id: organizationId,
    label: label || "Default",
    key_hash: hash,
    key_prefix: prefix,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/vendor/settings");
  return { key };
}

export async function revokeApiKey(keyId: string, organizationId: string) {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", keyId)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/vendor/settings");
}
