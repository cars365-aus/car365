"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createFeaturedPlacement(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const organizationId = String(formData.get("organizationId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "") || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");

  if (!organizationId || !startsAt || !endsAt) {
    throw new Error("Organization, start date, and end date are required.");
  }

  const { error } = await supabase.from("featured_placements").insert({
    organization_id: organizationId,
    vehicle_id: vehicleId,
    city,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/featured");
  revalidatePath("/");
}

export async function endFeaturedPlacement(placementId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("featured_placements")
    .update({ ends_at: new Date().toISOString() })
    .eq("id", placementId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/featured");
  revalidatePath("/");
}
