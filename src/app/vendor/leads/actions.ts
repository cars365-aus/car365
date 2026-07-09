"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { z } from "zod";

const updateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(["new", "contacted", "converted", "lost"]),
  notes: z.string().max(1000).optional(),
});

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error("Invalid input: " + parsed.error.message);
  }

  const { leadId, organizationId, status, notes } = parsed.data;

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify lead belongs to organization
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, status")
    .eq("id", leadId)
    .eq("vendor_id", organizationId)
    .single();

  if (leadError || !lead) {
    throw new Error("Lead not found or access denied");
  }

  const oldStatus = lead.status;

  // Update lead status
  const { error: updateError } = await supabase
    .from("leads")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) {
    throw new Error(`Failed to update lead: ${updateError.message}`);
  }

  // Add lead event
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_user_id: user.id,
    event_type: `status_changed_${status}`,
    metadata: {
      previous_status: oldStatus,
      new_status: status,
      notes: notes || null,
    },
  });

  // Add moderation note if provided
  if (notes) {
    await supabase.from("moderation_notes").insert({
      resource_type: "lead",
      resource_id: leadId,
      author_user_id: user.id,
      body: notes,
    });
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "lead_status_updated",
    resource_type: "lead",
    resource_id: leadId,
    metadata: {
      organization_id: organizationId,
      previous_status: oldStatus,
      new_status: status,
    },
  });

  revalidatePath("/vendor/leads");
  revalidatePath("/vendor/dashboard");
}

export async function addLeadNote(formData: FormData): Promise<void> {
  const user = await requireUser();

  const leadId = formData.get("leadId") as string;
  const organizationId = formData.get("organizationId") as string;
  const note = formData.get("note") as string;

  if (!leadId || !organizationId || !note || note.length > 1000) {
    throw new Error("Invalid input");
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify lead belongs to organization
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("vendor_id", organizationId)
    .single();

  if (!lead) {
    throw new Error("Lead not found or access denied");
  }

  // Add lead event for note
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_user_id: user.id,
    event_type: "note_added",
    metadata: { note },
  });

  revalidatePath("/vendor/leads");
}
