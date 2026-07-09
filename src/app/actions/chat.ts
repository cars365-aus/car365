"use server";

import { sendNewMessageNotification } from "@/lib/email/ses";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const sendMessageSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

async function notifyMessageRecipient(
  leadId: string,
  senderUserId: string,
  messageBody: string,
) {
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads")
    .select(`
      id, customer_email, customer_name, vendor_id,
      vehicles(title),
      organizations(name, billing_email)
    `)
    .eq("id", leadId)
    .single();

  if (!lead) return;

  type VehicleRow = { title: string };
  type OrgRow = { name: string; billing_email: string | null };
  const vehicle = lead.vehicles as unknown as VehicleRow | null;
  const org = lead.organizations as unknown as OrgRow | null;
  const vehicleTitle = vehicle?.title ?? "your enquiry";

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", senderUserId)
    .maybeSingle();

  const senderName = senderProfile?.full_name ?? "Someone";

  const { data: vendorMembers } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", lead.vendor_id)
    .in("role", ["owner", "admin", "manager"]);

  const vendorUserIds = new Set(vendorMembers?.map((m) => m.user_id) ?? []);
  const senderIsVendor = vendorUserIds.has(senderUserId);

  try {
    if (senderIsVendor) {
      await sendNewMessageNotification({
        to: lead.customer_email,
        recipientName: lead.customer_name,
        senderName: org?.name ?? senderName,
        vehicleTitle,
        messagePreview: messageBody,
        leadId,
        isVendorRecipient: false,
      });
    } else if (org?.billing_email) {
      await sendNewMessageNotification({
        to: org.billing_email,
        recipientName: org.name,
        senderName: lead.customer_name,
        vehicleTitle,
        messagePreview: messageBody,
        leadId,
        isVendorRecipient: true,
      });
    }
  } catch (err) {
    console.error("[chat] message notification failed:", err);
  }
}

export async function sendMessage(leadId: string, body: string) {
  const user = await requireUser();

  const payload = sendMessageSchema.safeParse({ leadId, body });
  if (!payload.success) {
    return { error: "Message must be between 1 and 2000 characters" };
  }

  // Use the admin client so we can perform authorization manually without
  // relying on RLS sub-selects. The RLS INSERT policy uses:
  //   l.customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
  // which silently returns NULL â€” and therefore denies the insert â€” whenever
  // profiles.email is NULL or when the user client session is not fully
  // hydrated. We replicate the same security semantics in application code.
  const supabase = createAdminClient();

  // Step 1: Fetch the current user's profile email.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[chat:sendMessage] profile query failed:", profileErr);
  }

  // Step 2: Fetch the target lead so we can check ownership.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, customer_email, customer_user_id, vendor_id")
    .eq("id", payload.data.leadId)
    .maybeSingle();

  if (leadErr) {
    console.error("[chat:sendMessage] lead query failed:", leadErr);
  }

  // Step 3: Check if the user is the customer who created the lead.
  // Primary check: UUID match via customer_user_id (populated for all new leads).
  // Fallback check: case-insensitive email match for older leads pre-dating the column.
  const isCustomerById = !!lead?.customer_user_id && lead.customer_user_id === user.id;
  const isCustomerByEmail =
    !!lead &&
    !!profile?.email &&
    lead.customer_email.toLowerCase() === profile.email.toLowerCase();
  const isCustomer = isCustomerById || isCustomerByEmail;

  // Step 4: Check if the user is a vendor org member (vendors reply in the same thread).
  const { data: membership, error: memberErr } = lead
    ? await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", lead.vendor_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  if (memberErr) {
    console.error("[chat:sendMessage] membership query failed:", memberErr);
  }
  const isVendorMember = !!membership;

  const isAuthorized = isCustomer || isVendorMember;

  // Structured server-side log â€” visible in Vercel / server logs for every send attempt.
  console.info("[chat:sendMessage] auth check", {
    userId: user.id,
    leadId: payload.data.leadId,
    profileEmail: profile?.email ?? null,
    leadCustomerEmail: lead?.customer_email ?? null,
    leadCustomerUserId: lead?.customer_user_id ?? null,
    isCustomerById,
    isCustomerByEmail,
    isCustomer,
    isVendorMember,
    isAuthorized,
    leadExists: !!lead,
  });

  // Step 5: Guard â€” reject unauthorized senders before touching the DB.
  if (!lead) {
    console.warn("[chat:sendMessage] lead not found", {
      userId: user.id,
      leadId: payload.data.leadId,
    });
    return { error: "Conversation not found." };
  }

  if (!isAuthorized) {
    console.warn("[chat:sendMessage] unauthorized send attempt", {
      userId: user.id,
      leadId: payload.data.leadId,
      profileEmail: profile?.email ?? null,
      leadCustomerEmail: lead.customer_email,
    });
    return { error: "Failed to send message. You may not have permission." };
  }

  // Step 6: Insert the message using the admin client (authorization already verified above).
  const { data, error } = await supabase
    .from("messages")
    .insert({
      lead_id: payload.data.leadId,
      sender_user_id: user.id,
      body: payload.data.body,
    })
    .select("id, lead_id, sender_user_id, body, created_at")
    .single();

  if (error) {
    console.error("[chat:sendMessage] insert failed", {
      userId: user.id,
      leadId: payload.data.leadId,
      supabaseError: error,
    });
    return { error: "Failed to send message. Please try again." };
  }

  console.info("[chat:sendMessage] message saved", {
    messageId: data.id,
    leadId: payload.data.leadId,
    userId: user.id,
  });

  void notifyMessageRecipient(payload.data.leadId, user.id, payload.data.body);

  return { data };
}
