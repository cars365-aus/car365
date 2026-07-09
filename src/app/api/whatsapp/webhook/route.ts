/**
 * Meta WhatsApp Business Cloud API webhook Route Handler.
 *
 * Mirrors the Stripe webhook (`src/app/api/stripe/webhook/route.ts`):
 *   - `GET`  performs Meta's subscription verification handshake.
 *   - `POST` verifies the `X-Hub-Signature-256` HMAC over the *raw* body,
 *     rate-limits per client IP, deduplicates by Cloud API message id in
 *     `whatsapp_webhook_events`, and always returns HTTP 200 for valid signed
 *     requests so Meta does not retry-storm on internal failures.
 *
 * Next.js 16 notes (per node_modules/next/dist/docs):
 *   - Route Handlers are uncached by default; `GET` can opt into caching, so we
 *     pin `dynamic = "force-dynamic"` to guarantee request-time execution.
 *   - The raw body MUST be read with `request.text()` *before* any JSON parse,
 *     because the HMAC is computed over the exact bytes Meta sent. No
 *     `bodyParser` config is needed in the App Router.
 */
import { NextResponse, type NextRequest } from "next/server";

import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { clientIp } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMetaSignature } from "@/lib/whatsapp/cloud-api";
import { getWhatsAppEnv } from "@/lib/whatsapp/env";
import {
  dedupeByMessageId,
  parseWebhookPayload,
  type ParsedInboundMessage,
} from "@/lib/whatsapp/inbound";
import { processInboundMessage } from "@/lib/whatsapp/process";
import { reportWhatsAppError } from "@/lib/whatsapp/observability";

/** Force request-time execution; this handler must never be cached. */
export const dynamic = "force-dynamic";

/** Reject request bodies larger than this (bytes) with HTTP 413. */
const MAX_PAYLOAD_BYTES = 1_000_000; // ~1 MB

/** Per-IP rate limit window for the POST endpoint. */
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

/**
 * GET — Meta subscription verification handshake.
 *
 * Responds with the raw `hub.challenge` (text/plain, 200) only when
 * `hub.mode === "subscribe"` and `hub.verify_token` matches the configured
 * verify token. Otherwise responds 403 without echoing the challenge.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  let verifyToken: string;
  try {
    verifyToken = getWhatsAppEnv().webhookVerifyToken;
  } catch {
    // Misconfigured environment — fail closed without leaking details.
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (mode === "subscribe" && token != null && token === verifyToken) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST — signed event callbacks from the Cloud API.
 *
 * Pipeline: raw body → size guard (413) → rate limit (429) → HMAC (401) →
 * JSON parse → parse + dedupe messages → per-message idempotent claim in
 * `whatsapp_webhook_events` → auto-responder processing → fast 200.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // 1. Read the raw body BEFORE parsing — required for the HMAC check.
  const rawBody = await request.text();

  // 2. Enforce a maximum payload size.
  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 3. Rate limit per client IP.
  const ip = clientIp(request.headers);
  const rate = await rateLimitSlidingWindow(
    `whatsapp-webhook:${ip}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rate.retryAfter
          ? { "Retry-After": String(rate.retryAfter) }
          : undefined,
      },
    );
  }

  // 4. Verify the Meta signature over the raw body.
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 5. Parse JSON, then extract + dedupe inbound messages.
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Signature was valid but the body is not JSON — nothing to process.
    return NextResponse.json({ received: true });
  }

  const { messages } = parseWebhookPayload(payload);
  const uniqueMessages = dedupeByMessageId(messages);

  // Non-message / unsupported events: nothing to do, acknowledge with 200.
  if (uniqueMessages.length === 0) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  // 6 & 7. Claim and process each message idempotently. Always return 200 for
  // valid signed requests — failures are recorded, never thrown, to avoid Meta
  // retry storms.
  for (const message of uniqueMessages) {
    await claimAndProcess(supabase, message, payload);
  }

  return NextResponse.json({ received: true });
}

/**
 * Idempotently claim a single inbound message in `whatsapp_webhook_events` and
 * run the auto-responder processing pipeline.
 *
 * Claim semantics (mirrors the Stripe handler):
 *   - already `processed` → skip (idempotent duplicate delivery).
 *   - already `processing` → skip (another delivery is in flight).
 *   - existing `failed`    → re-claim by flipping back to `processing`.
 *   - no row               → insert a new `processing` row.
 *
 * After processing runs the event is marked `processed`; if processing reports a
 * failure it is marked `failed` with `last_error`, but the caller still returns
 * HTTP 200.
 */
async function claimAndProcess(
  supabase: ReturnType<typeof createAdminClient>,
  message: ParsedInboundMessage,
  payload: unknown,
): Promise<void> {
  const eventId = message.messageId;

  try {
    const { data: existing } = await supabase
      .from("whatsapp_webhook_events")
      .select("id, processing_status")
      .eq("id", eventId)
      .maybeSingle();

    // Idempotency: skip anything already processed or in flight.
    if (
      existing?.processing_status === "processed" ||
      existing?.processing_status === "processing"
    ) {
      return;
    }

    const receivedAt = new Date().toISOString();
    const processingPayload = {
      event_type: "message",
      payload,
      processing_status: "processing",
      received_at: receivedAt,
      processed_at: null,
      last_error: null,
    };

    const claimResult = existing
      ? await supabase
          .from("whatsapp_webhook_events")
          .update(processingPayload)
          .eq("id", eventId)
          .eq("processing_status", "failed")
      : await supabase
          .from("whatsapp_webhook_events")
          .insert({ id: eventId, ...processingPayload });

    if (claimResult.error) {
      // Could not claim (e.g. a concurrent delivery won the race). Skip.
      reportWhatsAppError(new Error(claimResult.error.message), {
        stage: "webhook.claim",
        messageId: eventId,
        errorMessage: claimResult.error.message,
      });
      return;
    }

    // Run the auto-responder processing pipeline.
    const result = await processInboundMessage(message);

    if (result.ok) {
      await supabase
        .from("whatsapp_webhook_events")
        .update({
          processing_status: "processed",
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", eventId);
    } else {
      await supabase
        .from("whatsapp_webhook_events")
        .update({
          processing_status: "failed",
          last_error: result.error ?? "Unknown processing error",
        })
        .eq("id", eventId);
    }
  } catch (error) {
    // Record the failure but never throw — the webhook must still return 200.
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    reportWhatsAppError(error, {
      stage: "webhook.process",
      messageId: eventId,
      errorMessage,
    });
    await supabase
      .from("whatsapp_webhook_events")
      .update({ processing_status: "failed", last_error: errorMessage })
      .eq("id", eventId)
      .then(undefined, () => {
        /* best-effort: swallow secondary failures */
      });
  }
}
