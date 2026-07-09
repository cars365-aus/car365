"use server";

import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateCustomerProfile(formData: FormData) {
  const user = await requireUser();
  const supabase = createAdminClient();

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Full name is required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      full_name: fullName.trim(),
      phone: phone ? phone.trim() : null
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/customer/settings");
  revalidatePath("/customer/dashboard");
  return { success: true };
}

export async function deleteCustomerAccount(confirmation: string) {
  if (confirmation !== "DELETE") {
    return { error: "Invalid confirmation phrase." };
  }

  const user = await requireUser();
  const supabase = createAdminClient();

  try {
    // 1. Delete user from Supabase Auth
    // Because of foreign key constraints with ON DELETE CASCADE,
    // this will automatically delete their profile.
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error("Failed to delete user auth record:", error);
      return { error: "Failed to delete account. Please try again or contact support." };
    }

    // Success - the frontend should handle logging them out locally 
    // by redirecting to a signout route or calling supabase.auth.signOut().
    return { success: true };

  } catch (err) {
    console.error("Error deleting account:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

