/**
 * Inbound WhatsApp message processing orchestration.
 *
 * This module is the seam between the webhook Route Handler
 * (`src/app/api/whatsapp/webhook/route.ts`) and the auto-responder pipeline.
 * The Route Handler claims each inbound message idempotently in
 * `whatsapp_webhook_events` and then hands it to {@link processInboundMessage}.
 *
 * Orchestration order (see design.md "Request Lifecycle"):
 *   1. Load the auto-responder config (hot-read per event).
 *   2. ALWAYS persist the lead first (Property 6 â€” lead capture is independent
 *      of reply/notify success). A persistence failure is the only thing that
 *      fails the whole process.
 *   3. Short-circuit duplicate deliveries (idempotency) â€” the lead already
 *      exists, so re-sending the acknowledgement / re-notifying is suppressed.
 *   4. Acknowledgement: only when enabled AND the cooldown window allows it.
 *      A send failure is recorded but never fails the process.
 *   5. Recipient routing + email notification: vendor billing email when the
 *      lead is vendor-associated, otherwise the configured routing default.
 *      The notification status is recorded on the lead row.
 *
 * Never throws: every failure after lead persistence is caught and recorded so
 * the webhook can still return HTTP 200 to Meta and avoid retry storms. The
 * inbound message opens the 24h customer service window (captured by
 * `whatsapp_conversations.last_inbound_at` during persistence), so the
 * free-form acknowledgement is always within that window â€” no extra outbound
 * window logic is needed for the MVP.
 *
 * Untrusted content: message bodies are treated as untrusted and are never
 * logged in full; only short, sanitized previews flow into the notification
 * email (handled by `sendWhatsAppLeadAlert`). Secrets are never logged.
 */
import { getAppUrl } from "@/lib/config";
import { sendWhatsAppLeadAlert } from "@/lib/email/ses";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectReplyVariant, describeNextOpen } from "@/lib/whatsapp/business-hours";
import { sendCloudApiText } from "@/lib/whatsapp/cloud-api";
import { getAutoResponderConfig } from "@/lib/whatsapp/config";
import { shouldAcknowledge } from "@/lib/whatsapp/cooldown";
import type { ParsedInboundMessage } from "@/lib/whatsapp/inbound";
import { persistWhatsAppLead } from "@/lib/whatsapp/leads";
import {
  logProcessedMessage,
  reportWhatsAppError,
} from "@/lib/whatsapp/observability";
import { handleBotRouting } from "./bot-router";

/** Structured outcome of processing a single inbound message. */
export interface ProcessInboundResult {
  /** True when processing completed without an unrecoverable error. */
  ok: boolean;
  /** Human-readable failure reason when `ok` is false (never a secret). */
  error?: string;
}

/** Milliseconds per minute, for converting the cooldown window. */
const MS_PER_MINUTE = 60_000;

/**
 * Resolve the notification recipient email for a lead.
 *
 * When the lead carries a vendor association, the vendor organization's
 * `billing_email` is used; otherwise the configured routing default is used.
 * Defensive: any lookup failure (missing row, DB error, no billing email)
 * falls back to the routing default rather than throwing.
 *
 * @param supabase - Service-role client.
 * @param leadId - The persisted lead id, used to read its `vendor_id`.
 * @param routingDefaultEmail - Fallback recipient when no vendor email exists.
 */
async function resolveRecipientEmail(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  routingDefaultEmail: string,
): Promise<string> {
  try {
    const { data: lead } = await supabase
      .from("whatsapp_leads")
      .select("vendor_id")
      .eq("id", leadId)
      .maybeSingle();

    const vendorId = lead?.vendor_id as string | null | undefined;
    if (!vendorId) {
      return routingDefaultEmail;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("billing_email")
      .eq("id", vendorId)
      .maybeSingle();

    const billingEmail = org?.billing_email as string | null | undefined;
    if (billingEmail && billingEmail.trim().length > 0) {
      return billingEmail.trim();
    }
  } catch {
    // Defensive: routing must never block on a lookup failure.
  }

  return routingDefaultEmail;
}

/**
 * Process a single parsed inbound WhatsApp message.
 *
 * See the module docstring for the full orchestration contract. The lead is
 * always persisted before any send/notify work; downstream failures are
 * recorded but do not fail the process. Never throws.
 *
 * @param message - The parsed inbound message to process.
 */
export async function processInboundMessage(
  message: ParsedInboundMessage,
): Promise<ProcessInboundResult> {
  // 1. Load current config (hot-read so admin changes apply without redeploy).
  const config = await getAutoResponderConfig();

  // 2. Select the reply variant for "now" in the configured timezone, then
  //    ALWAYS persist the lead first. Lead capture is independent of any later
  //    send/notify outcome (Property 6). A persistence failure is the only
  //    condition that fails the whole process.
  const now = new Date();
  const variant = selectReplyVariant(now, config.businessHours);

  let persistResult;
  try {
    persistResult = await persistWhatsAppLead(message, variant);
  } catch (error) {
    reportWhatsAppError(error, {
      stage: "process.persist",
      messageId: message.messageId,
      variant,
      messageLength: message.text.length,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to persist WhatsApp lead",
    };
  }

  const { leadId, created } = persistResult;

  // 3. Duplicate delivery: the lead already existed, so suppress re-sending the
  //    acknowledgement and re-notifying to keep processing idempotent.
  if (!created) {
    return { ok: true };
  }

  const supabase = createAdminClient();

  // 4. Acknowledgement â€” only when enabled AND the cooldown window allows it.
  if (config.enabled) {
    let ackAllowed = false;
    try {
      ackAllowed = await shouldAcknowledge(
        message.from,
        config.cooldownMinutes * MS_PER_MINUTE,
      );
    } catch (error) {
      // Cooldown check failure must not block the rest of the pipeline.
      reportWhatsAppError(error, {
        stage: "process.cooldown",
        leadId,
        messageId: message.messageId,
        variant,
        messageLength: message.text.length,
      });
    }

    if (ackAllowed) {
      try {
        // If out of hours, send the away message first
        if (variant !== "in_hours") {
          const awayBody = `${config.awayMessage} ${describeNextOpen(now, config.businessHours)}`;
          const sendResult = await sendCloudApiText(message.from, awayBody);
          if (!sendResult.ok) {
            reportWhatsAppError(
              new Error(sendResult.error ?? sendResult.errorCode ?? "unknown error"),
              {
                stage: "process.acknowledge.away",
                leadId,
                messageId: message.messageId,
                errorCode: sendResult.errorCode,
                variant,
                messageLength: message.text.length,
              },
            );
          }
        }

        // Delegate to the interactive bot router
        await handleBotRouting(message);
      } catch (error) {
        reportWhatsAppError(
          error instanceof Error ? error : new Error("Bot routing failed"),
          {
            stage: "process.bot_routing",
            leadId,
            messageId: message.messageId,
            variant,
            messageLength: message.text.length,
          },
        );
      }
    }
  }

  // 5. Recipient routing + email notification. Wrapped in try/catch because
  //    sendWhatsAppLeadAlert throws after exhausting retries. The lead is
  //    already persisted, so a notification failure is recorded, not fatal.
  const recipientEmail = await resolveRecipientEmail(
    supabase,
    leadId,
    config.routingDefaultEmail,
  );

  let notifiedStatus = "sent";
  try {
    const leadUrl = `${getAppUrl()}/admin/whatsapp/leads/${leadId}`;
    await sendWhatsAppLeadAlert({
      to: recipientEmail,
      senderName: message.senderName ?? "WhatsApp customer",
      senderPhone: message.from,
      messagePreview: message.text,
      leadUrl,
    });
  } catch (error) {
    notifiedStatus = "failed";
    reportWhatsAppError(error, {
      stage: "process.notify",
      leadId,
      messageId: message.messageId,
      variant,
      messageLength: message.text.length,
    });
  }

  // Record the final notification outcome on the lead. Best-effort: a failure
  // to update the status must not fail the overall process.
  try {
    await supabase
      .from("whatsapp_leads")
      .update({ notified_status: notifiedStatus })
      .eq("id", leadId);
  } catch (error) {
    reportWhatsAppError(error, {
      stage: "process.status_update",
      leadId,
      messageId: message.messageId,
      variant,
      messageLength: message.text.length,
    });
  }

  // 6. Structured outcome â€” processing completed (lead saved, ack attempted,
  //    notification attempted and its status recorded). Emit exactly one
  //    structured log line per processed message (Requirement 9.5).
  logProcessedMessage({
    messageId: message.messageId,
    variant,
    leadId,
    notified: notifiedStatus,
  });

  return { ok: true };
}
