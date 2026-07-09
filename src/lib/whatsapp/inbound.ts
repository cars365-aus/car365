/**
 * Inbound webhook payload parser for the WhatsApp auto-responder.
 *
 * Meta delivers webhook callbacks with a deeply nested shape:
 *
 * ```
 * {
 *   object: "whatsapp_business_account",
 *   entry: [
 *     {
 *       id: "<waba-id>",
 *       changes: [
 *         {
 *           field: "messages",
 *           value: {
 *             messaging_product: "whatsapp",
 *             metadata: { display_phone_number, phone_number_id },
 *             contacts: [{ profile: { name }, wa_id }],
 *             messages: [{ id, from, timestamp, type, text: { body }, referral, context }],
 *             statuses: [{ id, status, timestamp, recipient_id }]
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * This module walks that structure defensively. Webhook payloads are untrusted
 * input from the network, so every accessor tolerates a missing, null, or
 * wrongly-typed field. {@link parseWebhookPayload} NEVER throws: on any shape
 * mismatch it simply yields fewer (or zero) parsed messages.
 *
 * The parser is pure — it performs no IO. Idempotency (ensuring a given
 * `messageId` is processed once) is enforced downstream at the database claim
 * layer; this module guarantees only that the same delivery always parses to
 * the same {@link ParsedInboundMessage.messageId}, which is what lets the caller
 * dedupe. The exported {@link dedupeByMessageId} helper makes that explicit.
 */

/** A click-to-chat referral / reply context distilled to what we care about. */
export interface InboundReferral {
  /** Vehicle slug resolved from the referral source URL, when present. */
  vehicleSlug?: string;
  /** Vendor/organization id resolved from the referral payload, when present. */
  vendorId?: string;
  /** The original referral/context object, retained for auditing. */
  raw?: unknown;
}

/** A single inbound WhatsApp message reduced to the fields we persist. */
export interface ParsedInboundMessage {
  /** Cloud API message id — stable across redeliveries; the dedupe key. */
  messageId: string;
  /** Sender phone number (E.164 digits, no `+`). */
  from: string;
  /** Sender display name from the contacts profile, when provided. */
  senderName?: string;
  /** Message text; empty string for non-text message types. */
  text: string;
  /** Raw Cloud API message type, e.g. "text" | "image" | "button". */
  type: string;
  /** Epoch seconds (Meta sends this as a string; coerced to a number here). */
  timestamp: number;
  /** Interactive payload when type is "interactive" (button or list reply). */
  interactive?: { id: string; title?: string };
  /** Click-to-chat / reply association, when the message carries one. */
  referral?: InboundReferral;
}

/** Result of parsing a webhook payload. */
export interface ParsedWebhookPayload {
  messages: ParsedInboundMessage[];
  /** Raw status-update entries, passed through untouched for the caller. */
  statuses: unknown[];
}

/** Narrow an unknown value to a plain object record. */
function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Narrow an unknown value to an array (empty array for anything else). */
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Read a string field, trimming it; returns undefined when absent/blank. */
function asTrimmedString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Coerce a Meta timestamp to epoch seconds. Meta sends it as a string of epoch
 * seconds, but we tolerate a numeric value too. Returns 0 when unparseable.
 */
function coerceTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

/** Slug segments are lowercase alphanumerics and hyphens. */
const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/**
 * Extract a vehicle slug from a `/cars/<slug>` (or `/vehicles/<slug>`) path in
 * a referral source URL. Returns undefined when no recognisable slug is found.
 */
function extractVehicleSlug(sourceUrl: string | undefined, params: URLSearchParams | null): string | undefined {
  // Prefer an explicit query parameter when present.
  const explicit = params?.get("vehicle") ?? params?.get("vehicleSlug") ?? params?.get("slug");
  const explicitSlug = asTrimmedString(explicit ?? undefined);
  if (explicitSlug && SLUG_SEGMENT.test(explicitSlug)) {
    return explicitSlug;
  }

  if (!sourceUrl) {
    return undefined;
  }

  // Find a `/cars/<slug>` or `/vehicles/<slug>` segment in the path.
  const match = /\/(?:cars|vehicles)\/([a-z0-9-]+)/i.exec(sourceUrl);
  const candidate = match?.[1];
  if (candidate && SLUG_SEGMENT.test(candidate)) {
    return candidate.toLowerCase();
  }

  return undefined;
}

/**
 * Extract a vendor/organization id from referral query params or the referral
 * body. Looks for common parameter names; returns undefined when not found.
 */
function extractVendorId(params: URLSearchParams | null): string | undefined {
  const candidate =
    params?.get("vendor") ?? params?.get("vendorId") ?? params?.get("vendor_id") ?? params?.get("org");
  return asTrimmedString(candidate ?? undefined);
}

/**
 * Build an {@link InboundReferral} from a message's `referral` and/or `context`
 * objects. Returns undefined when neither carries usable association data.
 */
function parseReferral(message: Record<string, unknown>): InboundReferral | undefined {
  const referral = asRecord(message.referral);
  const context = asRecord(message.context);

  if (!referral && !context) {
    return undefined;
  }

  const sourceUrl =
    asTrimmedString(referral?.source_url) ??
    asTrimmedString(referral?.sourceUrl) ??
    asTrimmedString(context?.source_url);

  // Parse query parameters out of the source URL when it is a valid URL.
  let params: URLSearchParams | null = null;
  if (sourceUrl) {
    try {
      params = new URL(sourceUrl).searchParams;
    } catch {
      params = null;
    }
  }

  const vehicleSlug = extractVehicleSlug(sourceUrl, params);
  const vendorId = extractVendorId(params);

  const raw = referral ?? context;
  const result: InboundReferral = { raw };
  if (vehicleSlug) {
    result.vehicleSlug = vehicleSlug;
  }
  if (vendorId) {
    result.vendorId = vendorId;
  }
  return result;
}

/**
 * Parse a single raw message entry into a {@link ParsedInboundMessage}.
 *
 * @param raw - One element of `value.messages[]`.
 * @param contactName - Sender display name resolved from `value.contacts[]`.
 * @returns the parsed message, or null when it lacks the required id/sender.
 */
function parseMessage(raw: unknown, contactName: string | undefined): ParsedInboundMessage | null {
  const message = asRecord(raw);
  if (!message) {
    return null;
  }

  const messageId = asTrimmedString(message.id);
  const from = asTrimmedString(message.from);
  if (!messageId || !from) {
    // Without a stable id or a sender there is nothing useful to persist.
    return null;
  }

  const type = asTrimmedString(message.type) ?? "text";

  // Text body lives at `text.body` for text messages; other types have none.
  const textObj = asRecord(message.text);
  const text = asTrimmedString(textObj?.body) ?? "";

  let interactive: { id: string; title?: string } | undefined = undefined;
  if (type === "interactive") {
    const intObj = asRecord(message.interactive);
    if (intObj) {
      const intType = asTrimmedString(intObj.type);
      if (intType === "button_reply") {
        const btn = asRecord(intObj.button_reply);
        if (btn && btn.id) interactive = { id: String(btn.id), title: asTrimmedString(btn.title) };
      } else if (intType === "list_reply") {
        const list = asRecord(intObj.list_reply);
        if (list && list.id) interactive = { id: String(list.id), title: asTrimmedString(list.title) };
      }
    }
  }

  const parsed: ParsedInboundMessage = {
    messageId,
    from,
    text,
    type,
    timestamp: coerceTimestamp(message.timestamp),
    ...(interactive ? { interactive } : {}),
  };

  if (contactName) {
    parsed.senderName = contactName;
  }

  const referral = parseReferral(message);
  if (referral) {
    parsed.referral = referral;
  }

  return parsed;
}

/**
 * Build a lookup of `wa_id` → profile name from a `value.contacts[]` array, plus
 * a single fallback name (the first contact) used when a message's sender does
 * not appear in the contacts list.
 */
function buildContactNames(contacts: unknown[]): {
  byWaId: Map<string, string>;
  fallback: string | undefined;
} {
  const byWaId = new Map<string, string>();
  let fallback: string | undefined;

  for (const entry of contacts) {
    const contact = asRecord(entry);
    if (!contact) {
      continue;
    }
    const profile = asRecord(contact.profile);
    const name = asTrimmedString(profile?.name);
    if (!name) {
      continue;
    }
    if (fallback === undefined) {
      fallback = name;
    }
    const waId = asTrimmedString(contact.wa_id);
    if (waId) {
      byWaId.set(waId, name);
    }
  }

  return { byWaId, fallback };
}

/**
 * Parse a Meta WhatsApp Cloud API webhook payload into typed messages and raw
 * status entries.
 *
 * Walks `entry[].changes[].value.{messages,statuses,contacts}` defensively.
 * Never throws: a null, empty, or structurally unexpected payload yields
 * `{ messages: [], statuses: [] }`.
 *
 * @param payload - The untrusted, JSON-parsed webhook body.
 */
export function parseWebhookPayload(payload: unknown): ParsedWebhookPayload {
  const messages: ParsedInboundMessage[] = [];
  const statuses: unknown[] = [];

  const root = asRecord(payload);
  if (!root) {
    return { messages, statuses };
  }

  for (const entryRaw of asArray(root.entry)) {
    const entry = asRecord(entryRaw);
    if (!entry) {
      continue;
    }

    for (const changeRaw of asArray(entry.changes)) {
      const change = asRecord(changeRaw);
      if (!change) {
        continue;
      }

      const value = asRecord(change.value);
      if (!value) {
        continue;
      }

      const { byWaId, fallback } = buildContactNames(asArray(value.contacts));

      for (const msgRaw of asArray(value.messages)) {
        const senderWaId = asTrimmedString(asRecord(msgRaw)?.from);
        const contactName = (senderWaId ? byWaId.get(senderWaId) : undefined) ?? fallback;
        const parsed = parseMessage(msgRaw, contactName);
        if (parsed) {
          messages.push(parsed);
        }
      }

      for (const statusRaw of asArray(value.statuses)) {
        if (statusRaw !== null && statusRaw !== undefined) {
          statuses.push(statusRaw);
        }
      }
    }
  }

  return { messages, statuses };
}

/**
 * Collapse parsed messages to one per `messageId`, keeping the first occurrence.
 *
 * This is a pure helper that makes duplicate-delivery handling explicit for the
 * caller. Authoritative idempotency is still enforced at the database claim
 * layer (`whatsapp_webhook_events`), but deduping in memory avoids redundant
 * work when Meta delivers the same message twice in one payload or batch.
 *
 * @param messages - Parsed inbound messages, possibly containing duplicates.
 * @returns messages with duplicate `messageId`s removed, original order kept.
 */
export function dedupeByMessageId(messages: readonly ParsedInboundMessage[]): ParsedInboundMessage[] {
  const seen = new Set<string>();
  const unique: ParsedInboundMessage[] = [];
  for (const message of messages) {
    if (seen.has(message.messageId)) {
      continue;
    }
    seen.add(message.messageId);
    unique.push(message);
  }
  return unique;
}
