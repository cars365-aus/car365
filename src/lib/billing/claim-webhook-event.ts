import type { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

type AdminClient = ReturnType<typeof createAdminClient>;

const STUCK_PROCESSING_MS = 5 * 60 * 1000;

export function serializeStripeEvent(event: Stripe.Event) {
  return JSON.parse(JSON.stringify(event)) as Stripe.Event;
}

export function describeClaimError(code: string | undefined, message: string) {
  if (code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "Database permission denied. Set SUPABASE_SERVICE_ROLE_KEY to the Supabase service role secret (sb_secret_...), not the publishable key, in your production environment.";
  }
  return message;
}

export async function claimStripeWebhookEvent(
  supabase: AdminClient,
  event: Stripe.Event,
): Promise<{ claimed: true } | { claimed: false; duplicate?: boolean; inProgress?: boolean; error: string; code?: string }> {
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, processing_status, received_at")
    .eq("id", event.id)
    .maybeSingle();

  if (existing?.processing_status === "processed") {
    return { claimed: false, duplicate: true, error: "already processed" };
  }

  if (existing?.processing_status === "processing" && existing.received_at) {
    const ageMs = Date.now() - new Date(existing.received_at).getTime();
    if (ageMs < STUCK_PROCESSING_MS) {
      return { claimed: false, inProgress: true, error: "already processing" };
    }
  }

  const receivedAt = new Date().toISOString();
  const processingPayload = {
    id: event.id,
    event_type: event.type,
    // Store a compact payload in the idempotency table; full event is saved in subscription_events.
    payload: {
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode,
    },
    processing_status: "processing" as const,
    received_at: receivedAt,
    last_error: null,
  };

  const claimResult = await supabase
    .from("stripe_webhook_events")
    .upsert(processingPayload, { onConflict: "id" });

  if (claimResult.error) {
    if (claimResult.error.code === "23505") {
      return { claimed: false, duplicate: true, error: "duplicate event" };
    }

    return {
      claimed: false,
      error: claimResult.error.message,
      code: claimResult.error.code,
    };
  }

  return { claimed: true };
}
