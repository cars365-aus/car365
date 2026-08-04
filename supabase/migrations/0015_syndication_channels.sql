-- ─────────────────────────────────────────────────────────────────────────────
-- 0015  Syndication Sprint 2: channel core, enum mapping, sync bookkeeping
--
-- Additive only. Creates no dependency on vehicle data, so it is safe to apply
-- before the VIN backfill completes — none of this publishes anything.
-- Adapters and any outbound push remain unbuilt (see docs/syndication/PLAN.md).
--
-- Still no ALTER on any existing website table (Hard Rule 2).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.channel_transport_kind as enum ('pull_feed', 'push_api');
create type public.channel_auth_kind as enum ('oauth', 'feed_url', 'none');

create type public.channel_connection_status as enum (
  'not_connected', 'connected', 'action_needed', 'error'
);

-- Publication state machine for one vehicle on one channel.
create type public.channel_listing_state as enum (
  'disabled', 'queued', 'pushed', 'live', 'rejected', 'removing', 'removed'
);

create type public.sync_run_trigger as enum ('scheduled', 'manual', 'sold_fastlane');
create type public.sync_run_status as enum ('running', 'success', 'aborted', 'failed');

-- ── channel ─────────────────────────────────────────────────────────────────
create table public.channel (
  code text primary key,
  display_name text not null,
  market text not null default 'AU',
  transport_kind public.channel_transport_kind not null,
  auth_kind public.channel_auth_kind not null,
  enabled boolean not null default false,
  -- {supports_leads, max_photos, title_max_len, allowed_body_types, ...}
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seeded disabled: a channel must be explicitly turned on after its connection
-- is proven, so applying this migration cannot start publishing anything.
insert into public.channel (code, display_name, transport_kind, auth_kind, enabled, capabilities) values
  ('google_vehicle_ads', 'Google Vehicle Ads', 'pull_feed', 'oauth', false,
   '{"supports_leads": true, "requires_vin": true, "requires_unique_vin": true, "max_photos": 20, "title_max_len": 150}'::jsonb),
  ('meta_marketplace', 'Meta Marketplace Vehicles', 'push_api', 'oauth', false,
   '{"supports_leads": true, "requires_vin": false, "min_odometer_km": 805, "condition_allowlist": ["used", "cpo"], "max_photos": 20}'::jsonb),
  ('whatsapp_catalog', 'WhatsApp Catalogue', 'push_api', 'oauth', false,
   '{"supports_leads": true, "deep_link_to_vdp": true, "max_photos": 10}'::jsonb),
  ('gumtree', 'Gumtree Australia', 'pull_feed', 'feed_url', false,
   '{"supports_leads": true, "requires_vin": false}'::jsonb),
  ('carsales', 'carsales.com.au', 'pull_feed', 'feed_url', false,
   '{"supports_leads": true, "requires_vin": false}'::jsonb),
  ('tiktok_display', 'TikTok (display only)', 'push_api', 'oauth', false,
   '{"supports_leads": false, "read_only": true}'::jsonb)
on conflict (code) do nothing;

-- ── channel_connection ──────────────────────────────────────────────────────
create table public.channel_connection (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.syndication_dealer(id) on delete cascade,
  channel_code text not null references public.channel(code) on delete cascade,
  status public.channel_connection_status not null default 'not_connected',

  -- Envelope-encrypted at the application layer with CREDENTIAL_ENCRYPTION_KEY.
  -- NEVER plaintext, never logged, never returned to a client (Hard Rule 5).
  credentials_encrypted bytea,
  external_account_id text,

  -- High-entropy token for pull_feed channels, derived from FEED_SIGNING_SECRET.
  -- `feed_token_previous` supports a 7-day grace window after rotation so a
  -- rotation cannot silently break a channel still polling the old URL (F18).
  feed_token text,
  feed_token_previous text,
  feed_token_rotated_at timestamptz,

  token_expires_at timestamptz,
  last_refreshed_at timestamptz,
  last_error_code text,
  last_error_message text,
  last_error_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealer_id, channel_code)
);

-- Hourly refresh job finds connections expiring within 24h (F16).
create index idx_channel_connection_expiring
  on public.channel_connection(token_expires_at)
  where token_expires_at is not null;

-- ── channel_listing ─────────────────────────────────────────────────────────
-- The source of truth for publication state: one row per (vehicle, channel).
create table public.channel_listing (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  channel_code text not null references public.channel(code) on delete cascade,
  external_id text,
  state public.channel_listing_state not null default 'disabled',

  -- Stable hash of the rendered payload. Unchanged hash → skip the push, which
  -- prevents rate-limit pressure and account flagging (F15).
  payload_hash text,
  enabled_by_default boolean not null default false,

  last_pushed_at timestamptz,
  last_seen_live_at timestamptz,

  -- Rejections are PERSISTED, never dropped (Hard Rule 7 / F19). The plain
  -- English message and fix hint are what staff read in the vehicle editor.
  rejection_code text,
  rejection_message text,
  rejection_fix_hint text,
  rejection_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vehicle_id, channel_code)
);

create index idx_channel_listing_state on public.channel_listing(channel_code, state);
create index idx_channel_listing_vehicle on public.channel_listing(vehicle_id);
-- Powers the "rejected on any channel" inventory filter.
create index idx_channel_listing_rejected
  on public.channel_listing(channel_code) where state = 'rejected';

-- ── channel_override ────────────────────────────────────────────────────────
-- Channel-specific field values. Architecture invariant: one canonical vehicle
-- shape; per-channel differences live here, never on the vehicle itself.
create table public.channel_override (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  channel_code text not null references public.channel(code) on delete cascade,
  field text not null,
  value text not null,
  created_at timestamptz not null default now(),
  unique (vehicle_id, channel_code, field)
);

-- ── channel_enum_map ────────────────────────────────────────────────────────
-- Every channel has its own closed vocabulary. An unmapped value is a HARD
-- rejection (UNMAPPED_ENUM), never a silent default — defaulting an unknown
-- body type to "Sedan" publishes a factually wrong advertisement (F6).
create table public.channel_enum_map (
  id uuid primary key default gen_random_uuid(),
  channel_code text not null references public.channel(code) on delete cascade,
  canonical_field text not null,
  canonical_value text not null,
  channel_value text not null,
  created_at timestamptz not null default now(),
  unique (channel_code, canonical_field, canonical_value)
);

create index idx_channel_enum_map_lookup
  on public.channel_enum_map(channel_code, canonical_field);

-- Seed the FULL schema enum surface, not merely the values live data happens to
-- contain today. Seeding only observed values means the first electric car or
-- convertible listed fails at publish time with UNMAPPED_ENUM.
insert into public.channel_enum_map (channel_code, canonical_field, canonical_value, channel_value) values
  -- Google Vehicle Ads — body style
  ('google_vehicle_ads', 'body_type', 'sedan',         'Sedan'),
  ('google_vehicle_ads', 'body_type', 'hatch',         'Hatchback'),
  ('google_vehicle_ads', 'body_type', 'suv',           'SUV'),
  ('google_vehicle_ads', 'body_type', 'ute',           'Pickup'),
  ('google_vehicle_ads', 'body_type', 'wagon',         'Wagon'),
  ('google_vehicle_ads', 'body_type', 'coupe',         'Coupe'),
  ('google_vehicle_ads', 'body_type', 'convertible',   'Convertible'),
  ('google_vehicle_ads', 'body_type', 'van',           'Van'),
  ('google_vehicle_ads', 'body_type', 'people_mover',  'Minivan'),
  ('google_vehicle_ads', 'fuel_type', 'petrol',        'Gasoline'),
  ('google_vehicle_ads', 'fuel_type', 'diesel',        'Diesel'),
  ('google_vehicle_ads', 'fuel_type', 'hybrid',        'Hybrid'),
  ('google_vehicle_ads', 'fuel_type', 'phev',          'Plug-in Hybrid'),
  ('google_vehicle_ads', 'fuel_type', 'electric',      'Electric'),
  ('google_vehicle_ads', 'fuel_type', 'lpg',           'LPG'),
  ('google_vehicle_ads', 'transmission', 'automatic',  'Automatic'),
  ('google_vehicle_ads', 'transmission', 'manual',     'Manual'),
  ('google_vehicle_ads', 'transmission', 'cvt',        'Automatic'),
  ('google_vehicle_ads', 'transmission', 'dct',        'Automatic'),
  ('google_vehicle_ads', 'drivetrain', 'fwd',          'FWD'),
  ('google_vehicle_ads', 'drivetrain', 'rwd',          'RWD'),
  ('google_vehicle_ads', 'drivetrain', 'awd',          'AWD'),
  ('google_vehicle_ads', 'drivetrain', 'four_wd',      '4WD'),
  ('google_vehicle_ads', 'condition', 'used',          'Used'),
  ('google_vehicle_ads', 'condition', 'cpo',           'Certified pre-owned'),
  ('google_vehicle_ads', 'condition', 'demo',          'Used'),

  -- Meta Marketplace Vehicles
  ('meta_marketplace', 'body_type', 'sedan',           'SEDAN'),
  ('meta_marketplace', 'body_type', 'hatch',           'HATCHBACK'),
  ('meta_marketplace', 'body_type', 'suv',             'SUV'),
  ('meta_marketplace', 'body_type', 'ute',             'TRUCK'),
  ('meta_marketplace', 'body_type', 'wagon',           'WAGON'),
  ('meta_marketplace', 'body_type', 'coupe',           'COUPE'),
  ('meta_marketplace', 'body_type', 'convertible',     'CONVERTIBLE'),
  ('meta_marketplace', 'body_type', 'van',             'VAN'),
  ('meta_marketplace', 'body_type', 'people_mover',    'MINIVAN'),
  ('meta_marketplace', 'fuel_type', 'petrol',          'GASOLINE'),
  ('meta_marketplace', 'fuel_type', 'diesel',          'DIESEL'),
  ('meta_marketplace', 'fuel_type', 'hybrid',          'HYBRID'),
  ('meta_marketplace', 'fuel_type', 'phev',            'PLUGIN_HYBRID'),
  ('meta_marketplace', 'fuel_type', 'electric',        'ELECTRIC'),
  ('meta_marketplace', 'fuel_type', 'lpg',             'OTHER'),
  ('meta_marketplace', 'transmission', 'automatic',    'AUTOMATIC'),
  ('meta_marketplace', 'transmission', 'manual',       'MANUAL'),
  ('meta_marketplace', 'transmission', 'cvt',          'AUTOMATIC'),
  ('meta_marketplace', 'transmission', 'dct',          'AUTOMATIC'),
  ('meta_marketplace', 'drivetrain', 'fwd',            'FWD'),
  ('meta_marketplace', 'drivetrain', 'rwd',            'RWD'),
  ('meta_marketplace', 'drivetrain', 'awd',            'AWD'),
  ('meta_marketplace', 'drivetrain', 'four_wd',        'FOUR_WHEEL_DRIVE'),
  ('meta_marketplace', 'condition', 'used',            'USED'),
  ('meta_marketplace', 'condition', 'cpo',             'CERTIFIED_PRE_OWNED'),
  ('meta_marketplace', 'condition', 'demo',            'USED')
on conflict (channel_code, canonical_field, canonical_value) do nothing;

-- ── sync_run ────────────────────────────────────────────────────────────────
create table public.sync_run (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.syndication_dealer(id) on delete cascade,
  channel_code text not null references public.channel(code) on delete cascade,
  trigger public.sync_run_trigger not null,

  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.sync_run_status not null default 'running',

  item_count integer not null default 0,
  ok_count integer not null default 0,
  rejected_count integer not null default 0,
  skipped_count integer not null default 0,

  -- Volume guard bookkeeping. `previous_item_count` is the comparison baseline;
  -- `forced_by` records the human who overrode a tripped guard, because an
  -- override that wipes a dealer's listings must be attributable.
  previous_item_count integer,
  volume_guard_tripped boolean not null default false,
  volume_guard_reason text,
  forced_by uuid references auth.users(id),

  feed_storage_key text,
  -- Truncated before storage; raw responses can contain tokens and PII (F17).
  raw_response_truncated text,
  error_summary text,

  -- True when the run only simulated the push (SYNDICATION_LIVE_PUSH unset or
  -- non-production). Distinguishes "nothing happened" from "nothing was sent".
  dry_run boolean not null default true
);

create index idx_sync_run_recent on public.sync_run(channel_code, started_at desc);
-- The volume guard's baseline lookup: the most recent successful run.
create index idx_sync_run_last_success
  on public.sync_run(dealer_id, channel_code, started_at desc)
  where status = 'success';

-- ── syndication_event (append-only audit log) ───────────────────────────────
create table public.syndication_event (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  -- staff user id, or NULL for 'system'
  actor uuid references auth.users(id),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  channel_code text references public.channel(code) on delete set null,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb
);

create index idx_syndication_event_recent on public.syndication_event(at desc);
create index idx_syndication_event_vehicle on public.syndication_event(vehicle_id, at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Staff-only across the board. `channel_connection` in particular holds
-- encrypted credentials and feed tokens and must never be readable by a buyer.
alter table public.channel enable row level security;
alter table public.channel_connection enable row level security;
alter table public.channel_listing enable row level security;
alter table public.channel_override enable row level security;
alter table public.channel_enum_map enable row level security;
alter table public.sync_run enable row level security;
alter table public.syndication_event enable row level security;

create policy "channel staff manage" on public.channel
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "channel_connection staff manage" on public.channel_connection
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "channel_listing staff manage" on public.channel_listing
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "channel_override staff manage" on public.channel_override
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "channel_enum_map staff manage" on public.channel_enum_map
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "sync_run staff read" on public.sync_run
for select using (app_private.is_staff());

-- The audit log is append-only: staff may read and insert, never update or
-- delete. An audit trail a staff member can rewrite is not an audit trail.
create policy "syndication_event staff read" on public.syndication_event
for select using (app_private.is_staff());
create policy "syndication_event staff insert" on public.syndication_event
for insert with check (app_private.is_staff());

-- Credentials are never exposed through PostgREST to buyer-facing roles.
revoke all on public.channel_connection from anon, authenticated;
grant select, insert, update, delete on public.channel_connection to service_role;
