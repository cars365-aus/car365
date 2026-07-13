"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (updateError) {
    throw new Error(`Failed to update lead: ${updateError.message}`);
  }

  // Log the event
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event: "status_changed",
    data: { to: status }
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  
  return { success: true };
}
