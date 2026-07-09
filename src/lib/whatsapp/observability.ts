/**
 * WhatsApp observability + input sanitization helpers.
 *
 * Centralizes the structured logging, error reporting, and untrusted-content
 * sanitization used by the inbound webhook and processing pipeline so that the
 * "no secret leakage" invariant (design.md Property 8 / Requirement 9.1) is
 * enforced in one place.
 *
 * Three concerns live here:
 *
 *   1. {@link reportWhatsAppError} — report an error to Sentry with a *curated*
 *      context. Sentry is an optional dependency in this project: it ships in
 *      `package.json` but is not guaranteed to be initialized. Every call is
 *      therefore wrapped in try/catch and no-ops safely when Sentry is absent
 *      or uninitialized. A structured `console.error` fallback line is always
 *      emitted so failures remain visible without Sentry.
 *
 *   2. {@link sanitizeInboundText} — strip control characters, collapse
 *      whitespace, and cap length on untrusted inbound message content before
 *      it is persisted or rendered (Requirement 9.2).
 *
 *   3. {@link logProcessedMessage} — emit exactly one structured log line per
 *      processed inbound message (Requirement 9.5).
 *
 * IMPORTANT (Property 8): callers MUST only pass non-secret, curated context —
 * ids, codes, lengths, and the reply variant. This module never accepts or
 * forwards `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, or full message
 * bodies. The {@link WhatsAppErrorContext} type intentionally constrains the
 * accepted shape to reinforce that at the call sites.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Curated, secret-free context attached to a reported WhatsApp error.
 *
 * Only safe-to-log primitives are permitted: identifiers, error/status codes,
 * the reply variant, and content *lengths* (never the content itself). This
 * shape is the guardrail for Property 8 — there is deliberately no field for a
 * message body, access token, or app secret.
 */
export interface WhatsAppErrorContext {
  /** Where the error happened, e.g. "process.acknowledge" or "webhook.claim". */
  stage: string;
  /** Persisted lead id, when known. */
  leadId?: string;
  /** Cloud API message id, when known. */
  messageId?: string;
  /** Cloud API / application error code, when known. */
  errorCode?: string;
  /** Selected reply variant ("in_hours" | "away"), when known. */
  variant?: string;
  /** Length of the inbound message body — never the body itself. */
  messageLength?: number;
  /** A short, secret-free error message. */
  errorMessage?: string;
}

/** Maximum characters of untrusted inbound content retained for persistence. */
const INBOUND_TEXT_MAX_LENGTH = 1000;

/**
 * Sanitize untrusted inbound WhatsApp text for safe persistence or render.
 *
 * Strips control characters (defends against log spoofing / header injection),
 * collapses runs of whitespace into a single space, trims, and caps the length
 * at {@link INBOUND_TEXT_MAX_LENGTH}. Pure and side-effect free.
 *
 * @param raw - The untrusted inbound text (may be empty for non-text messages).
 * @returns the sanitized, length-capped string.
 */
export function sanitizeInboundText(raw: string): string {
  if (!raw) {
    return "";
  }

  // Replace any control characters (including CR/LF/tabs) with a single space,
  // then collapse remaining whitespace runs.
  const collapsed = raw
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (collapsed.length <= INBOUND_TEXT_MAX_LENGTH) {
    return collapsed;
  }
  return collapsed.slice(0, INBOUND_TEXT_MAX_LENGTH);
}

/**
 * Report a WhatsApp error to Sentry with curated, secret-free context.
 *
 * Defensive by design: Sentry may not be initialized in this project, so the
 * `captureException` call is wrapped in try/catch and never throws or breaks
 * the caller. A structured `console.error` fallback is always emitted so the
 * failure is visible regardless of Sentry availability.
 *
 * The `context` is constrained to {@link WhatsAppErrorContext}; callers MUST
 * NOT pass secrets or full message bodies (Property 8).
 *
 * @param error - The thrown value (logged by message only, never secrets).
 * @param context - Curated, non-secret metadata describing the failure.
 */
export function reportWhatsAppError(
  error: unknown,
  context: WhatsAppErrorContext,
): void {
  const errorMessage =
    error instanceof Error ? error.message : context.errorMessage ?? "unknown error";

  // Always emit a structured fallback log line (no secrets, no full body).
  try {
    console.error(
      JSON.stringify({
        event: "whatsapp_error",
        ...context,
        errorMessage,
      }),
    );
  } catch {
    // Never let logging failures escape.
  }

  // Best-effort Sentry capture. No-ops safely if Sentry is not initialized.
  try {
    Sentry.captureException(error, {
      tags: {
        feature: "whatsapp",
        stage: context.stage,
        ...(context.errorCode ? { errorCode: context.errorCode } : {}),
        ...(context.variant ? { variant: context.variant } : {}),
      },
      extra: {
        leadId: context.leadId,
        messageId: context.messageId,
        errorCode: context.errorCode,
        variant: context.variant,
        messageLength: context.messageLength,
      },
    });
  } catch {
    // Sentry unavailable / uninitialized — fallback log already emitted.
  }
}

/**
 * Emit exactly one structured log line for a successfully processed inbound
 * message (Requirement 9.5).
 *
 * Contains only safe metadata — message id, reply variant, lead id, and the
 * notification outcome. Never includes the message body or any secret.
 *
 * @param entry - The per-message structured log fields.
 */
export function logProcessedMessage(entry: {
  messageId: string;
  variant: string;
  leadId: string;
  notified: string;
}): void {
  try {
    console.info(
      JSON.stringify({
        event: "whatsapp_message_processed",
        messageId: entry.messageId,
        variant: entry.variant,
        leadId: entry.leadId,
        notified: entry.notified,
      }),
    );
  } catch {
    // Never let logging failures escape.
  }
}
