/**
 * WhatsApp lead persistence.
 *
 * Turns a {@link ParsedInboundMessage} into durable Supabase rows:
 *
 *   1. Validate the message with {@link whatsappInboundSchema} before any write.
 *   2. Upsert a `whatsapp_conversations` row keyed by the sender phone.
 *   3. Resolve an optional vendor/vehicle association from the click-to-chat
 *      referral (best-effort — a failed lookup never blocks lead capture).
 *   4. Insert a `whatsapp_leads` row referencing the conversation.
 *
 * The webhook is unauthenticated server-to-server traffic, so all writes use the
 * service-role {@link createAdminClient} (which bypasses RLS).
 *
 * Idempotency: `whatsapp_leads.wa_message_id` carries a unique constraint. If the
 * same Cloud API message is delivered twice, the second insert raises a unique
 * violation; we detect that case and return the existing lead id with
 * `created: false` instead of throwing, so reprocessing a duplicate is safe.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { whatsappInboundSchema } from "@/lib/validation/schemas";
import type { ParsedInboundMessage } from "@/lib/whatsapp/inbound";
import type { ReplyVariant } from "@/lib/whatsapp/business-hours";
import { sanitizeInboundText } from "@/lib/whatsapp/observability";

/** Outcome of persisting an inbound message. */
export interface PersistLeadResult {
  /** Id of the `whatsapp_leads` row (existing one when this was a duplicate). */
  leadId: string;
  /** Id of the associated `whatsapp_conversations` row. */
  conversationId: string;
  /** True when a new lead was inserted; false when it already existed. */
  created: boolean;
}

/** Postgres unique-violation error code. */
const UNIQUE_VIOLATION = "23505";

/** Loose v1-v5 UUID matcher used to validate referral vendor ids. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A resolved vendor/vehicle association derived from a referral. */
interface ResolvedAssociation {
  vendorId: string | null;
  vehicleId: string | null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Resolve vendor and/or vehicle ids from an inbound message's referral.
 *
 * Best-effort and defensive: any lookup failure (missing referral, unknown
 * slug, DB error) resolves to `null` associations rather than throwing, so lead
 * capture is never blocked by association resolution.
 *
 * - When the referral carries a `vehicleSlug`, the vehicle is looked up in the
 *   `vehicles` table to obtain its `id` and owning `organization_id` (vendor).
 * - When the referral carries a `vendorId` that looks like a UUID, it is used
 *   directly as the vendor id (only when not already resolved via the vehicle).
 */
async function resolveAssociation(
  supabase: AdminClient,
  msg: ParsedInboundMessage,
): Promise<ResolvedAssociation> {
  const result: ResolvedAssociation = { vendorId: null, vehicleId: null };

  const referral = msg.referral;
  if (!referral) {
    return result;
  }

  // Vehicle slug → vehicle id + owning organization (vendor).
  if (referral.vehicleSlug) {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, organization_id")
        .eq("slug", referral.vehicleSlug)
        .maybeSingle();

      if (!error && data) {
        result.vehicleId = (data.id as string) ?? null;
        result.vendorId = (data.organization_id as string) ?? null;
      }
    } catch {
      // Defensive: a lookup failure must not block lead creation.
    }
  }

  // Explicit vendor id from the referral, only when it looks like a UUID and we
  // have not already resolved a vendor from the vehicle lookup.
  if (!result.vendorId && referral.vendorId && UUID_RE.test(referral.vendorId)) {
    result.vendorId = referral.vendorId;
  }

  return result;
}

/**
 * Upsert the conversation row for a sender and return its id.
 *
 * Creates the conversation when the phone is unseen; otherwise refreshes
 * `last_inbound_at`, the resolved `vendor_id` (when newly known), and
 * `sender_name` (when the message provides one). Keyed by the unique `phone`
 * column so concurrent deliveries converge on a single conversation.
 */
async function upsertConversation(
  supabase: AdminClient,
  phone: string,
  senderName: string | undefined,
  vendorId: string | null,
  inboundAt: string,
): Promise<string> {
  const update: Record<string, unknown> = { last_inbound_at: inboundAt };
  if (senderName) {
    update.sender_name = senderName;
  }
  if (vendorId) {
    update.vendor_id = vendorId;
  }

  // Try to update an existing conversation first.
  const { data: existing, error: updateError } = await supabase
    .from("whatsapp_conversations")
    .update(update)
    .eq("phone", phone)
    .select("id")
    .maybeSingle();

  if (!updateError && existing?.id) {
    return existing.id as string;
  }

  // No existing row — insert a new conversation. Handle a concurrent insert
  // (unique violation on phone) by re-reading the now-present row.
  const insertRow: Record<string, unknown> = {
    phone,
    last_inbound_at: inboundAt,
  };
  if (senderName) {
    insertRow.sender_name = senderName;
  }
  if (vendorId) {
    insertRow.vendor_id = vendorId;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("whatsapp_conversations")
    .insert(insertRow)
    .select("id")
    .single();

  if (!insertError && inserted?.id) {
    return inserted.id as string;
  }

  if (insertError?.code === UNIQUE_VIOLATION) {
    const { data: raced } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone", phone)
      .single();
    if (raced?.id) {
      return raced.id as string;
    }
  }

  throw new Error(
    `Failed to upsert WhatsApp conversation: ${insertError?.message ?? "unknown error"}`,
  );
}

/**
 * Persist an inbound WhatsApp message as a conversation + lead.
 *
 * @param msg - The parsed inbound message.
 * @param variant - The acknowledgement variant selected for this message.
 * @returns the lead id, conversation id, and whether a new lead was created.
 * @throws when validation fails or a non-idempotent database error occurs.
 */
export async function persistWhatsAppLead(
  msg: ParsedInboundMessage,
  variant: ReplyVariant,
): Promise<PersistLeadResult> {
  // 1. Validate before any DB write. The schema is the source of truth for
  //    field constraints (digit-only phone, size limits, etc.).
  const validated = whatsappInboundSchema.parse({
    messageId: msg.messageId,
    from: msg.from,
    senderName: msg.senderName,
    text: msg.text,
    type: msg.type,
    timestamp: msg.timestamp,
  });

  const supabase = createAdminClient();
  const inboundAt = new Date(validated.timestamp * 1000).toISOString();

  // 2. Resolve optional vendor/vehicle association (best-effort).
  const association = await resolveAssociation(supabase, msg);

  // 3. Upsert the conversation, carrying the resolved vendor when known.
  const conversationId = await upsertConversation(
    supabase,
    validated.from,
    validated.senderName,
    association.vendorId,
    inboundAt,
  );

  // 4. Insert the lead. A unique violation on wa_message_id means we already
  //    persisted this delivery — return the existing lead for idempotency.
  //    The message body is untrusted external content, so it is sanitized
  //    (control chars stripped, whitespace collapsed, length capped) before
  //    persistence (Requirement 9.2).
  const { data: lead, error: leadError } = await supabase
    .from("whatsapp_leads")
    .insert({
      conversation_id: conversationId,
      wa_message_id: validated.messageId,
      sender_phone: validated.from,
      sender_name: validated.senderName ?? null,
      message_body: sanitizeInboundText(validated.text),
      message_type: validated.type,
      reply_variant: variant,
      vendor_id: association.vendorId,
      vehicle_id: association.vehicleId,
    })
    .select("id")
    .single();

  if (!leadError && lead?.id) {
    return { leadId: lead.id as string, conversationId, created: true };
  }

  if (leadError?.code === UNIQUE_VIOLATION) {
    const { data: existing } = await supabase
      .from("whatsapp_leads")
      .select("id, conversation_id")
      .eq("wa_message_id", validated.messageId)
      .single();

    if (existing?.id) {
      return {
        leadId: existing.id as string,
        conversationId: (existing.conversation_id as string) ?? conversationId,
        created: false,
      };
    }
  }

  throw new Error(
    `Failed to persist WhatsApp lead: ${leadError?.message ?? "unknown error"}`,
  );
}
