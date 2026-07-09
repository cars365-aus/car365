"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateNotificationPrefs(formData: FormData) {
  const user = await requireUser();
  const supabase = createAdminClient();

  const prefs = {
    inquiryUpdates: formData.get("inquiryUpdates") === "on",
    specialOffers: formData.get("specialOffers") === "on",
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customer/settings");
  return { success: true };
}
