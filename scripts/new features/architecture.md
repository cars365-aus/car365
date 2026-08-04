# Syndication Architecture

## 1. Shape

```
Existing Cars 365 tables (READ ONLY)
            │
            ▼
   syndication_vehicle_projection      ← adapters read only this
            │
            ▼
      ┌───────────────┐
      │  Sync Engine  │  transform → validate → publish → reconcile
      └───────┬───────┘
              │
    pull_feed │ push_api
   ┌──────────┴──────────┐
   ▼                     ▼
Static feed files    Channel APIs
(CDN, signed URL)   (Google, Meta)
   │                     │
   └────────┬────────────┘
            ▼
      Lead webhooks → lead inbox (attributed)
```

## 2. Projection layer

The existing website schema is the source of truth for vehicle data. Syndication reads it through a projection — a view or materialised view — that outputs the canonical shape below. Adapters consume **only** the projection.

Rationale: the website team can change its tables; syndication breaks at one seam you control, not in six adapters. And syndication can never corrupt website data because it holds no write path.

If a required canonical field does not exist in the legacy schema, add it to a **new sidecar table** (`syndication_vehicle_extra`) keyed by the legacy vehicle id, and LEFT JOIN it in the projection. Do not add columns to legacy tables.

### Canonical projection output

```sql
CREATE VIEW syndication_vehicle_projection AS SELECT
  v.id                     AS vehicle_id,
  v.dealer_id,
  v.location_id,
  v.stock_number,
  x.vin,                          -- 17 chars, validated checksum
  x.rego, x.rego_state,
  v.make, v.model, x.variant, x.badge,
  x.body_type,                    -- canonical enum, see §3
  v.year,
  x.odometer_km,                  -- ALWAYS km, integer. Convert at adapter.
  x.transmission, x.fuel_type, x.drivetrain,
  x.doors, x.seats, x.engine_cc,
  x.colour_exterior, x.colour_interior,
  x.condition,                    -- used | cpo | demo   (NEVER new)
  v.price_amount,
  x.price_type,                   -- drive_away | ex_gov
  'AUD'                    AS currency,
  v.status,                       -- draft|active|reserved|sold|archived
  v.description               AS description_raw,
  x.description_generated,
  x.description_approved_at,      -- NULL = never publish generated text
  x.build_date, x.compliance_date, x.wovr_flag,
  v.updated_at, v.sold_at,
  v.version                       -- optimistic locking
FROM legacy_vehicles v
LEFT JOIN syndication_vehicle_extra x ON x.vehicle_id = v.id
WHERE v.deleted_at IS NULL;
```

## 3. Enum mapping — fail loud

Every channel has its own closed vocabulary for body type, transmission, fuel, condition, colour.

```
mapping(channel_code, canonical_field, canonical_value) → channel_value
```

**An unmapped value is a hard rejection with reason `UNMAPPED_ENUM`, surfaced to staff. It must never silently default.** Defaulting an unknown body type to "Sedan" publishes a factually wrong advertisement.

Seed the mapping tables from `channels.md`, expose them in an internal admin screen so a non-engineer can add a mapping when a new value appears.

## 4. New tables

```sql
channel (
  code PK, display_name, market,
  transport_kind,          -- pull_feed | push_api
  auth_kind,               -- oauth | feed_url | none
  enabled BOOLEAN,
  capabilities JSONB       -- {supports_leads, max_photos, title_max_len, ...}
)

channel_connection (
  id PK, dealer_id, channel_code,
  status,                  -- not_connected | connected | action_needed | error
  credentials_encrypted BYTEA,   -- envelope encrypted; NEVER plaintext
  external_account_id,
  feed_token,              -- high entropy, for pull_feed channels
  token_expires_at, last_refreshed_at,
  last_error_code, last_error_message, last_error_at,
  UNIQUE(dealer_id, channel_code)
)

channel_listing (
  id PK, vehicle_id, channel_code,
  external_id,
  state,                   -- disabled|queued|pushed|live|rejected|removing|removed
  payload_hash,
  enabled_by_default BOOLEAN,   -- came from settings vs manual override
  last_pushed_at, last_seen_live_at,
  rejection_code, rejection_message, rejection_at,
  UNIQUE(vehicle_id, channel_code)
)

channel_override (vehicle_id, channel_code, field, value)

channel_enum_map (channel_code, canonical_field, canonical_value, channel_value)

sync_run (
  id PK, dealer_id, channel_code, trigger,   -- scheduled|manual|sold_fastlane
  started_at, finished_at, status,
  item_count, ok_count, rejected_count, skipped_count,
  previous_item_count, volume_guard_tripped BOOLEAN, forced_by,
  feed_storage_key, raw_response_truncated TEXT,
  error_summary
)

syndication_event (          -- append-only audit log
  id PK, at, actor,          -- staff_user_id | 'system'
  vehicle_id, channel_code, event_type, detail JSONB
)

lead (
  id PK, dealer_id, vehicle_id NULL, channel_code,
  channel_lead_id,
  contact_name, contact_phone, contact_email,   -- encrypted at rest
  message, raw_payload JSONB,
  tracking_number_id, click_id,
  received_at,
  outcome,                 -- new|contacted|qualified|junk|won|lost
  outcome_at, outcome_by, sale_price,
  UNIQUE(channel_code, channel_lead_id)
)

tracking_number (id PK, dealer_id, channel_code, e164, provider_id, assigned_at, released_at)
```

Indexes: `channel_listing(channel_code, state)`, `channel_listing(vehicle_id)`, `lead(dealer_id, received_at DESC)`, `lead(outcome)`, `sync_run(channel_code, started_at DESC)`.

## 5. Adapter interface

```ts
interface ChannelAdapter {
  code: string;
  transportKind: 'pull_feed' | 'push_api';

  // PURE. No I/O, no clock, no randomness. This is the contract.
  transform(
    v: CanonicalVehicle,
    dealer: Dealer,
    location: Location,
    overrides: Override[],
    enumMap: EnumMap
  ): TransformResult;

  // pull_feed only: serialise the accepted payloads
  renderFeed?(payloads: ChannelPayload[]): Buffer;

  // push_api only
  push?(payloads: ChannelPayload[], conn: Connection): Promise<PushResult[]>;
  remove?(externalIds: string[], conn: Connection): Promise<PushResult[]>;
}

type TransformResult =
  | { ok: true;  payload: ChannelPayload; warnings: Warning[] }
  | { ok: false; rejections: Rejection[] };

interface Rejection {
  code: string;      // MISSING_VIN | UNMAPPED_ENUM | ODOMETER_TOO_LOW | ...
  field: string;
  message: string;   // plain English, shown to staff verbatim
  fixHint: string;   // "Add the VIN in the Identity section"
}
```

`transform` being pure is what allows the admin editor to show staff exactly what will be rejected, before publishing, using the identical code path.

## 6. Sync engine

### Pipeline

```
1. acquire single-flight lock (dealer_id, channel_code) — abort if held
2. open sync_run
3. select candidate vehicles:
     status = 'active'
     AND channel_listing.state != 'disabled'
     AND channel eligibility (e.g. Meta: condition != 'new')
4. transform each → accepted[] / rejected[]
5. persist rejections to channel_listing (state='rejected'), never drop them
6. VOLUME GUARD on accepted.length vs previous_item_count → abort if tripped
7. pull_feed:  render → temp key → validate → atomic pointer swap
   push_api:   filter by payload_hash change → batch → push with backoff
8. update channel_listing state + payload_hash + last_pushed_at
9. close sync_run; alert if rejected_count spiked or guard tripped
10. release lock (in finally — always)
```

### Schedules

| Job | Cadence | Notes |
|---|---|---|
| Feed render | every 30 min + on-change debounce (2 min) | Cheap; channels fetch on their own schedule |
| Push sync | every 30 min | Only changed payload hashes |
| **Sold fast-lane** | immediate on `status → sold` | Bypasses debounce and normal queue priority |
| Reconciliation | nightly | Diff should-be-live vs channel-reported-live; alert on drift |
| Token refresh | hourly | Refresh anything expiring < 24h; set `action_needed` on failure |
| Price/VDP consistency | nightly | Assert VDP-rendered price == feed price for every live listing |

### Sold fast-lane

`status → sold` must trigger an immediate removal push, not the next scheduled run. Stale listings for sold vehicles are a bait-advertising exposure under Australian Consumer Law. Note that Meta only drops a listing at its next feed ingest and it may remain visible for up to ~24h afterwards — show staff this expectation in the UI so they do not think the system is broken.

### Feed URL security

Per-dealer per-channel token: `HMAC(FEED_SIGNING_SECRET, dealer_id || channel_code || salt)`, ≥32 bytes entropy. Channels fetch unauthenticated from rotating IPs, so the URL cannot be IP-restricted or auth-gated. Token must be rotatable from the admin UI (rotation invalidates the old URL and requires re-pasting at the channel — warn staff before rotating). Treat feed contents as public: they mirror the public website.

## 7. Admin portal surfaces

### Settings → Connections
Card per channel. States: `Not connected` / `Connected` / `Action needed` / `Error`.
- `auth_kind = oauth` → **Connect** button, OAuth redirect, then show linked account id
- `auth_kind = feed_url` → copyable feed URL, **Copy** button, collapsible "How to install this at {channel}" instructions, **Rotate URL** (with confirmation)
- Every card shows: last successful sync, live listing count, rejection count (links to filtered inventory), last error

### Settings → Syndication defaults
- Per-channel default on/off for new listings
- **Auto-publish** master toggle
- Readiness gates (all required when auto-publish is on): price set, ≥ N photos, all channel-required fields present, description approved
- Auto-remove on sold: **on, not user-disableable**

### Vehicle editor → Channels panel
- Checkbox per connected channel, pre-checked from defaults, per-vehicle override
- Status chip per channel: `Live` / `Queued` / `Rejected` / `Not connected` / `Disabled`
- **Inline readiness validator** — runs every adapter's `transform` in dry-run on save/blur and lists rejections with `fixHint`, in the editor, before publish
- Rejected chips expand to the plain-English reason

### Inventory list
- Per-channel status column (compact icon grid)
- Filters: `rejected on any channel`, `not live on {channel}`, `missing VIN`
- Bulk actions: enable/disable channel for selection, force re-push

### Leads inbox
- Columns: received, channel, vehicle, contact, outcome
- One-tap outcome tagging (`contacted` / `qualified` / `junk` / `won` / `lost`)
- Filter by channel; per-channel counts of won/junk — this is the report that justifies the product's price

### Sync health page
- `sync_run` history per channel, item counts, rejection counts
- Prominent banner when the volume guard has tripped, with the force-override control gated behind a typed confirmation
