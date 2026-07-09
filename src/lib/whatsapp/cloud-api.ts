/**
 * WhatsApp Cloud API signature verification and outbound message client.
 *
 * Mirrors the Stripe webhook pattern used elsewhere in the repo: signatures
 * are verified over the raw request body using a constant-time comparison, and
 * outbound sends never throw — they return a structured {@link SendMessageResult}
 * so the webhook handler can record failures without crashing.
 *
 * Secrets (access token, app secret) are read only via {@link getWhatsAppEnv}
 * and are never logged or surfaced in returned errors.
 */
import crypto from "node:crypto";

import { normaliseWhatsAppNumber } from "@/lib/whatsapp";

import { getWhatsAppEnv } from "./env";

/** Prefix Meta uses on the `X-Hub-Signature-256` header value. */
const SIGNATURE_PREFIX = "sha256=";

/**
 * Verify the `X-Hub-Signature-256` header against the raw request body.
 *
 * Computes `sha256=` + HMAC-SHA256(rawBody, appSecret) and compares it to the
 * supplied header using {@link crypto.timingSafeEqual} to avoid timing leaks.
 *
 * This function never throws: a missing header, malformed header, or any
 * internal error results in `false`.
 *
 * @param rawBody - The exact, unparsed request body string.
 * @param signatureHeader - The `X-Hub-Signature-256` header value, or null.
 * @returns true only when the signature is present and matches exactly.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  try {
    const { appSecret } = getWhatsAppEnv();

    const expected =
      SIGNATURE_PREFIX +
      crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

    const expectedBuffer = Buffer.from(expected, "utf8");
    const providedBuffer = Buffer.from(signatureHeader, "utf8");

    // timingSafeEqual throws on length mismatch — guard explicitly so a
    // differing length is treated as a non-match rather than an error.
    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/** Structured result of an outbound Cloud API send. Never indicates a throw. */
export interface SendMessageResult {
  /** True when the Cloud API accepted the message. */
  ok: boolean;
  /** Cloud API message id, when the send succeeded. */
  messageId?: string;
  /** Cloud API / transport error code, when the send failed. */
  errorCode?: string;
  /** Human-readable error reason, when the send failed (never a secret). */
  error?: string;
}

/** Build the Graph API messages endpoint for the configured phone number. */
function buildMessagesUrl(apiVersion: string, phoneNumberId: string): string {
  return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
}

/**
 * POST a payload to the Cloud API messages endpoint and normalise the result.
 *
 * Centralises auth, error handling, and response parsing for the public
 * `sendCloudApiText` / `sendCloudApiTemplate` helpers. Never throws.
 */
async function postMessage(
  payload: Record<string, unknown>,
): Promise<SendMessageResult> {
  let env;
  try {
    env = getWhatsAppEnv();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "WhatsApp environment not configured",
    };
  }

  try {
    const response = await fetch(
      buildMessagesUrl(env.apiVersion, env.phoneNumberId),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json().catch(() => null)) as
      | {
          messages?: { id?: string }[];
          error?: { code?: number | string; message?: string };
        }
      | null;

    if (!response.ok) {
      const apiError = data?.error;
      return {
        ok: false,
        errorCode:
          apiError?.code !== undefined
            ? String(apiError.code)
            : String(response.status),
        error: apiError?.message ?? `Cloud API responded with ${response.status}`,
      };
    }

    return {
      ok: true,
      messageId: data?.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cloud API request failed",
    };
  }
}

/**
 * Send a free-form text message via the Cloud API.
 *
 * Valid only inside the customer service window. Never throws — failures are
 * returned as `{ ok: false, ... }`.
 *
 * @param to - Recipient phone number (any format; normalised internally).
 * @param body - Message text to send.
 */
export async function sendCloudApiText(
  to: string,
  body: string,
): Promise<SendMessageResult> {
  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normaliseWhatsAppNumber(to),
    type: "text",
    text: { body },
  });
}

/**
 * Send an approved template message via the Cloud API.
 *
 * Used to initiate or continue conversations outside the customer service
 * window. Never throws — failures are returned as `{ ok: false, ... }`.
 *
 * @param to - Recipient phone number (any format; normalised internally).
 * @param templateName - Name of the approved Meta message template.
 * @param language - BCP-47 / Meta language code (e.g. "en_US").
 * @param components - Optional template components (header/body params).
 */
export async function sendCloudApiTemplate(
  to: string,
  templateName: string,
  language: string,
  components?: unknown[],
): Promise<SendMessageResult> {
  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normaliseWhatsAppNumber(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      ...(components ? { components } : {}),
    },
  });
}

/**
 * Send an interactive message (list or buttons) via the Cloud API.
 *
 * @param to - Recipient phone number (any format; normalised internally).
 * @param interactive - The interactive object matching Meta's spec.
 */
export async function sendCloudApiInteractive(
  to: string,
  interactive: Record<string, unknown>,
): Promise<SendMessageResult> {
  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normaliseWhatsAppNumber(to),
    type: "interactive",
    interactive,
  });
}
