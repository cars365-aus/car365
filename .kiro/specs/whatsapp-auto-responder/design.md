# Design Document

## Overview

This design adds a two-way WhatsApp auto-responder built on the **Meta WhatsApp Business Cloud API**. It mirrors the existing Stripe webhook architecture (`src/app/api/stripe/webhook/route.ts`): a single Next.js Route Handler receives signed callbacks, verifies them against a secret, deduplicates via an events table, and processes asynchronously while returning fast. Inbound messages are persisted as `whatsapp_leads`, the sender receives an automatic acknowledgement (in-hours or away variant), and a recipient (vendor or support) is notified by email via the existing Resend integration.

The MVP delivers: webhook verification + receipt, instant auto-acknowledgement with cooldown, business-hours/away routing, inbound lead capture, recipient notification, and an admin config page. FAQ keyword auto-replies are deferred but the dispatcher is structured so they can be added as an additional reply strategy without rework.

### Goals

- Securely receive and verify Meta Cloud API webhooks (GET handshake + POST HMAC).
- Send an automatic acknowledgement once per conversation per cooldown window.
- Vary the reply by configured business hours and timezone (DST-correct).
- Persist every inbound message as a lead, idempotently, with RLS.
- Notify the routed recipient by email.
- Provide an admin-editable configuration without redeploys.
- Never leak secrets; treat all inbound content as untrusted.

### Non-Goals

- FAQ/keyword conversational flows (deferred phase).
- Media (image/audio/document) message handling beyond recording that a non-text message arrived.
- A WhatsApp-native inbox UI for replying from the dashboard (email notification + existing leads view only).
- Outbound marketing/template campaigns.

## Architecture

```mermaid
flowchart TD
    Meta[Meta WhatsApp Cloud API] -->|GET verify| WH[/api/whatsapp/webhook]
    Meta -->|POST signed events| WH
    WH -->|verify token / HMAC| Verify[verifyMetaSignature]
    WH -->|dedupe by message id| EventsTbl[(whatsapp_webhook_events)]
    WH --> Dispatch[processInboundMessage]
    Dispatch --> Cfg[getAutoResponderConfig]
    Cfg --> ConfigTbl[(whatsapp_auto_responder_config)]
    Dispatch --> Lead[persistWhatsAppLead]
    Lead --> LeadsTbl[(whatsapp_leads + whatsapp_conversations)]
    Dispatch --> Hours[selectReplyVariant business hours]
    Dispatch --> Cooldown[shouldAcknowledge cooldown]
    Cooldown --> Redis[(Redis / fallback)]
    Dispatch --> Send[sendCloudApiMessage]
    Send --> Meta
    Dispatch --> Notify[notifyLeadRecipient]
    Notify --> Resend[Resend email]
    Dispatch --> Sentry[Sentry on error]

    Admin[Admin user] --> AdminPage[/admin/whatsapp]
    AdminPage -->|requireAdmin| ConfigAction[updateAutoResponderConfig server action]
    ConfigAction --> ConfigTbl
    ConfigAction --> Audit[(audit_logs)]
```

### Request Lifecycle (POST webhook)

1. Read raw body (`request.text()`), reject if over max size → 413.
2. Apply Redis rate limit keyed by client IP → 429 if exceeded.
3. Verify `X-Hub-Signature-256` HMAC over the raw body using the app secret → 401 on mismatch/missing.
4. Parse JSON; extract message entries. Ignore non-message / unsupported events (return 200).
5. For each inbound message, claim it in `whatsapp_webhook_events` by Cloud API message id (insert; if already `processed`, skip).
6. Persist the `whatsapp_lead` (+ conversation upsert).
7. Determine reply variant (business hours) and whether to acknowledge (cooldown).
8. If enabled and acknowledgement due, send via Cloud API.
9. Notify recipient by email.
10. Mark event `processed`; always return 200 (record failures rather than throwing) so Meta does not retry storms.

## Components and Interfaces

### 1. Route Handler — `src/app/api/whatsapp/webhook/route.ts`

```typescript
// GET: subscription verification handshake
export async function GET(request: NextRequest): Promise<Response>;
// POST: signed event callbacks
export async function POST(request: NextRequest): Promise<Response>;
```

- `GET` reads `hub.mode`, `hub.verify_token`, `hub.challenge`. Returns `challenge` (200) only when `hub.mode === "subscribe"` and the token matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; otherwise 403.
- `POST` follows the Stripe handler shape: raw body, signature check, idempotency table, fast 200.
- `export const dynamic = "force-dynamic"` and read raw body before any parsing (required for HMAC).

### 2. Signature & Client — `src/lib/whatsapp/cloud-api.ts`

```typescript
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean;

export interface SendMessageResult { ok: boolean; messageId?: string; errorCode?: string; error?: string; }

export async function sendCloudApiText(to: string, body: string): Promise<SendMessageResult>;
export async function sendCloudApiTemplate(to: string, templateName: string, language: string, components?: unknown[]): Promise<SendMessageResult>;
```

- `verifyMetaSignature` computes `sha256=` + HMAC-SHA256(rawBody, appSecret) and compares using `crypto.timingSafeEqual`.
- `sendCloudApiText` POSTs to `https://graph.facebook.com/v21.0/{phoneNumberId}/messages` with the access token; returns a structured result instead of throwing, so the webhook never crashes on send failure.
- Reuses `normaliseWhatsAppNumber` from existing `src/lib/whatsapp.ts` for the `to` field.

### 3. Inbound Parser — `src/lib/whatsapp/inbound.ts`

```typescript
export interface ParsedInboundMessage {
  messageId: string;
  from: string;            // sender phone (E.164 digits)
  senderName?: string;
  text: string;            // empty string for non-text messages
  type: string;            // "text" | "image" | ... raw type
  timestamp: number;       // epoch seconds from Meta
  referral?: { vehicleSlug?: string; vendorId?: string; raw?: unknown };
}

export function parseWebhookPayload(payload: unknown): { messages: ParsedInboundMessage[]; statuses: unknown[] };
```

- Tolerant parsing of the `entry[].changes[].value.messages[]` structure; never throws on shape mismatch (returns empty arrays).
- Extracts click-to-chat `referral` / `context` payloads where present to associate a vehicle/vendor.

### 4. Business Hours — `src/lib/whatsapp/business-hours.ts`

```typescript
export type ReplyVariant = "in_hours" | "away";
export interface DayHours { open: string; close: string } // "HH:MM" 24h, or null = closed
export interface BusinessHours { timezone: string; days: Record<Weekday, DayHours | null> }

export function selectReplyVariant(now: Date, hours: BusinessHours): ReplyVariant;
export function describeNextOpen(now: Date, hours: BusinessHours): string; // for away message
```

- Uses `Intl.DateTimeFormat` with the configured IANA `timeZone` to get the local weekday + minutes-of-day, avoiding manual DST math. This is the DST-correct strategy (Req 3.6) since `Intl` honors the zone's current offset.
- Unconfigured/`null` weekday → `away` (Req 3.5).

### 5. Cooldown — `src/lib/whatsapp/cooldown.ts`

```typescript
export async function shouldAcknowledge(phone: string, cooldownMs: number): Promise<boolean>;
```

- Uses Redis `SET key NX PX cooldownMs` (`whatsapp:ack:<phone>`); returns true only when the key was newly set. Falls back to an in-memory `Map` with timestamps when Redis is unavailable, mirroring `rate-limit-redis.ts` fallback behavior.

### 6. Lead Persistence — `src/lib/whatsapp/leads.ts`

```typescript
export interface PersistLeadResult { leadId: string; conversationId: string; created: boolean; }
export async function persistWhatsAppLead(msg: ParsedInboundMessage, variant: ReplyVariant): Promise<PersistLeadResult>;
```

- Validates with `whatsappInboundSchema` (Zod) before insert.
- Upserts a `whatsapp_conversations` row by phone; inserts a `whatsapp_leads` row referencing it.
- Resolves vendor association from `referral` when present (looks up vehicle by slug / vendor id).
- Uses `createAdminClient()` (service role) since the webhook is unauthenticated server-to-server.

### 7. Notification — extends `src/lib/email/resend.ts`

```typescript
export async function sendWhatsAppLeadAlert(input: {
  to: string; senderName: string; senderPhone: string; messagePreview: string; leadUrl: string;
}): Promise<{ skipped: boolean }>;
```

- Mirrors existing `sendLeadAlert`; no-ops when Resend is unconfigured. Retries handled by a small wrapper (configurable max attempts).

### 8. Config Access — `src/lib/whatsapp/config.ts`

```typescript
export interface AutoResponderConfig {
  enabled: boolean;
  cooldownMinutes: number;
  inHoursMessage: string;
  awayMessage: string;
  businessHours: BusinessHours;
  routingDefaultEmail: string;
}
export async function getAutoResponderConfig(): Promise<AutoResponderConfig>;
export async function updateAutoResponderConfig(patch: AutoResponderConfig, adminId: string): Promise<void>;
```

- Reads a single-row `whatsapp_auto_responder_config` table; returns typed defaults if no row exists (Req 7.4 hot-reload — every webhook reads current config).
- `updateAutoResponderConfig` validates with Zod, writes the row, and records an `audit_logs` entry.

### 9. Environment — `src/lib/whatsapp/env.ts`

Centralizes required vars via the existing `requireEnv`/`optionalEnv` helpers (the repo accesses env through `src/lib/config.ts`, not `createEnv`). A `getWhatsAppEnv()` function throws a named error if any required var is missing (Req 8.2), and is never logged.

| Variable | Purpose |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Cloud API bearer token (secret) |
| `WHATSAPP_PHONE_NUMBER_ID` | Sender phone number id |
| `WHATSAPP_WABA_ID` | WhatsApp Business Account id |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | GET handshake token (secret) |
| `WHATSAPP_APP_SECRET` | HMAC signing secret (secret) |
| `WHATSAPP_API_VERSION` | optional, defaults `v21.0` |

### 10. Admin UI — `src/app/admin/whatsapp/page.tsx` + server action

- Page guarded by existing `requireAdmin()`. Renders a form (Design System inputs) for enabled flag, cooldown, message text, per-weekday hours, timezone, routing default. Read-only connection status section shows configured phone number id (never the token) and webhook subscription hint.
- Submits to `updateAutoResponderConfig` server action with Zod validation and inline errors.

## Data Models

### Migration: `whatsapp_auto_responder_config` (single-row)

```sql
create table whatsapp_auto_responder_config (
  id boolean primary key default true check (id),      -- enforces single row
  enabled boolean not null default true,
  cooldown_minutes integer not null default 60 check (cooldown_minutes between 0 and 1440),
  in_hours_message text not null,
  away_message text not null,
  business_hours jsonb not null,                        -- { timezone, days: {...} }
  routing_default_email text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
```

### Migration: `whatsapp_conversations`

```sql
create table whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  sender_name text,
  last_inbound_at timestamptz,
  vendor_id uuid references organizations(id),
  created_at timestamptz not null default now()
);
```

### Migration: `whatsapp_leads`

```sql
create table whatsapp_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references whatsapp_conversations(id),
  wa_message_id text not null unique,                   -- idempotency at the lead level
  sender_phone text not null,
  sender_name text,
  message_body text not null,
  message_type text not null default 'text',
  reply_variant text not null check (reply_variant in ('in_hours','away')),
  vendor_id uuid references organizations(id),
  vehicle_id uuid references vehicles(id),
  notified_status text not null default 'pending',
  created_at timestamptz not null default now()
);
```

### Migration: `whatsapp_webhook_events` (idempotency, mirrors `stripe_webhook_events`)

```sql
create table whatsapp_webhook_events (
  id text primary key,                                  -- Cloud API message id
  event_type text,
  processing_status text not null default 'processing', -- processing | processed | failed
  payload jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);
```

### RLS (Req 4.5)

- `whatsapp_leads`: enable RLS. Admin policy (full read) using existing admin claim pattern. Vendor read policy: `vendor_id` maps to the requesting user's organization (same pattern used by the existing `leads` table). Service role (webhook) bypasses RLS.
- `whatsapp_auto_responder_config` and `whatsapp_webhook_events`: admin/service-role only.

### Zod Schemas (added to `src/lib/validation/schemas.ts`)

```typescript
export const whatsappInboundSchema = z.object({
  messageId: z.string().min(1).max(200),
  from: z.string().min(6).max(20).regex(/^\d+$/),
  senderName: z.string().trim().max(160).optional(),
  text: z.string().max(4096).default(""),
  type: z.string().max(40).default("text"),
  timestamp: z.number().int().nonnegative(),
});

export const autoResponderConfigSchema = z.object({
  enabled: z.boolean(),
  cooldownMinutes: z.number().int().min(0).max(1440),
  inHoursMessage: z.string().trim().min(1).max(1000),
  awayMessage: z.string().trim().min(1).max(1000),
  routingDefaultEmail: z.string().trim().email(),
  businessHours: z.object({
    timezone: z.string().refine(isValidTimezone, "Invalid IANA timezone"),
    days: z.record(z.enum(WEEKDAYS), dayHoursSchema.nullable()),
  }),
});
// dayHoursSchema refines close > open
```

## Error Handling

| Scenario | Handling | Req |
|---|---|---|
| GET token mismatch | 403, no challenge echoed | 1.2 |
| Missing/invalid HMAC | 401, no processing | 1.4 |
| Payload too large | 413 | 9.4 |
| Rate limit exceeded | 429 with `Retry-After` | 1.8 |
| Duplicate message id | skip processing, 200 | 1.7 |
| Lead persistence fails | log + Sentry, mark event failed, still 200 | 4.6, 9.3 |
| Cloud API send fails | record error reason, continue, lead still saved | 2.5, 9.3 |
| Notification fails | retry up to max, record final status | 5.5 |
| Cloud API policy/rate error | record error code, no aggressive retry | 6.4 |
| Unexpected event type | ignore, 200 | 1.6 |

Sentry captures exclude secrets and exclude full message bodies (only a short preview / length) per Req 9.1.

## Security Considerations

- **Signature verification** with `timingSafeEqual` over the raw, unparsed body (parsing first would break the HMAC).
- **Secrets** only via `getWhatsAppEnv()`; never logged, never surfaced in admin UI or errors (Req 8.3, 8.5).
- **Untrusted input**: message bodies sanitized before persistence, before HTML rendering in admin, and before inclusion in emails (Req 9.2). Stored as text; rendered with React's default escaping; email uses plain text like existing alerts.
- **Service role** client used only inside the server-only webhook and server actions, never shipped to the client.
- **Rate limiting** on the POST endpoint via existing Redis sliding window.
- **RLS** prevents cross-vendor lead access.

## Testing Strategy

Unit tests (Vitest, colocated `*.test.ts` per repo convention):

- `cloud-api.test.ts` — `verifyMetaSignature`: valid, invalid, missing signature (Req 10.1).
- `business-hours.test.ts` — in-hours, out-of-hours, unconfigured weekday, DST boundary (e.g., AEST↔AEDT for `Australia/Sydney`) (Req 10.2).
- `cooldown.test.ts` — first message acknowledges, repeat within window suppressed, after window acknowledges again (Req 10.3); uses in-memory fallback path.
- `schemas.test.ts` additions — `whatsappInboundSchema` and `autoResponderConfigSchema` accept valid / reject malformed (Req 10.4).
- `inbound.test.ts` — duplicate message id processed once (idempotency unit around the parser + claim logic) (Req 10.5).

Build integrity: `next build`, `eslint`, and `vitest run` must all pass (Req 10.6). Verification gate matches the repo's CI conventions; the Next.js version (16.2.6) docs in `node_modules/next/dist/docs/` should be consulted before authoring the Route Handler since App Router conventions may differ from training data.

## Correctness Properties

These are invariants the implementation must uphold, suitable for property-based testing where noted.

### Property 1: Signature verification is exact and constant-time
For any body `b` and any signature `s`, `verifyMetaSignature(b, s)` returns true if and only if `s === "sha256=" + HMAC_SHA256(b, appSecret)`. Any single-byte mutation of the body or signature yields false. (PBT: random bodies + random tampering.)

**Validates: Requirements 1.3, 1.4**

### Property 2: Reply-variant selection is total and deterministic
For any `now` and any `BusinessHours`, `selectReplyVariant` returns exactly one of `"in_hours" | "away"` and never throws. A `null`/unconfigured weekday always yields `"away"`. The same inputs always yield the same output.

**Validates: Requirements 3.2, 3.3, 3.5**

### Property 3: Business-hours boundary correctness
A timestamp strictly inside an open interval (in the configured timezone) is `in_hours`; a timestamp before open or at/after close is `away`. This holds across DST transitions for the configured zone. (PBT: random times across a year for a DST zone.)

**Validates: Requirements 3.2, 3.3, 3.6**

### Property 4: Cooldown suppression is idempotent within the window
For a fixed phone and cooldown `c`, the first `shouldAcknowledge` in a window returns true and every subsequent call within `c` returns false; the first call after `c` returns true again. At most one acknowledgement per phone per window.

**Validates: Requirements 2.3**

### Property 5: Idempotent inbound processing
Processing the same `wa_message_id` two or more times produces at most one `whatsapp_lead` row and at most one acknowledgement send. (PBT: random duplicate-delivery orderings.)

**Validates: Requirements 1.7**

### Property 6: Lead capture independent of reply success
A valid inbound message always results in a persisted `whatsapp_lead` regardless of whether the acknowledgement send succeeds, fails, or is suppressed (disabled/cooldown).

**Validates: Requirements 2.4, 2.5, 4.1**

### Property 7: Schema validation soundness
`whatsappInboundSchema.parse` succeeds for any payload meeting the field constraints and rejects any payload violating them (e.g., non-digit `from`, oversized `text`). Validation has no side effects.

**Validates: Requirements 4.4**

### Property 8: No secret leakage
No code path writes `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_APP_SECRET` to logs, error messages, Sentry payloads, or admin UI output.

**Validates: Requirements 8.3, 8.5, 9.1**

## Design Decisions & Rationale

1. **Mirror the Stripe webhook pattern** rather than invent a new one — proven in this repo for signature verification, idempotency table, and fast-200 semantics. Lowers risk and review burden.
2. **`Intl.DateTimeFormat` for timezone math** instead of a date library — zero new dependencies (Req 13-style bundle discipline) and inherently DST-correct.
3. **Redis `SET NX PX` for cooldown** — atomic, distributed, and already the platform's primitive; in-memory fallback keeps local/dev working.
4. **Email notification (not WhatsApp template) for recipients** — avoids Meta template approval overhead for the MVP and reuses the existing Resend path; WhatsApp outbound remains available via `sendCloudApiTemplate` for a later phase.
5. **Single-row config table with hot read** — satisfies "apply without redeploy" (Req 7.4) without a caching layer; the webhook reads config per event, which is cheap relative to the outbound API calls.
6. **Return 200 even on internal failure** (after recording) — prevents Meta retry storms while preserving the lead and surfacing failures to Sentry/monitoring.
