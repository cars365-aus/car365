-- WhatsApp Auto-Responder: tables, RLS, and default config seed.
-- Mirrors the existing Stripe webhook + leads architecture:
--   * whatsapp_webhook_events mirrors stripe_webhook_events (idempotency, fast-200).
--   * whatsapp_leads RLS mirrors the public.leads vendor/admin pattern.
-- Inserts/updates are performed by the webhook via the service role, which
-- bypasses RLS; the policies below govern authenticated (admin/vendor) reads.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Single-row configuration table. The boolean primary key with a check
-- constraint enforces that at most one row can ever exist (id must be true).
create table public.whatsapp_auto_responder_config (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  cooldown_minutes integer not null default 60 check (cooldown_minutes between 0 and 1440),
  in_hours_message text not null,
  away_message text not null,
  business_hours jsonb not null,
  routing_default_email text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  sender_name text,
  last_inbound_at timestamptz,
  vendor_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.whatsapp_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  wa_message_id text not null unique,
  sender_phone text not null,
  sender_name text,
  message_body text not null,
  message_type text not null default 'text',
  reply_variant text not null check (reply_variant in ('in_hours', 'away')),
  vendor_id uuid references public.organizations(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  notified_status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Idempotency table, mirrors public.stripe_webhook_events.
create table public.whatsapp_webhook_events (
  id text primary key,
  event_type text,
  processing_status text not null default 'processing' check (processing_status in ('processing', 'processed', 'failed')),
  payload jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

-- ---------------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------------

create index idx_whatsapp_leads_conversation_id on public.whatsapp_leads(conversation_id);
create index idx_whatsapp_leads_vendor_id on public.whatsapp_leads(vendor_id);
create index idx_whatsapp_leads_created_at on public.whatsapp_leads(created_at desc);
create index idx_whatsapp_webhook_events_received_at on public.whatsapp_webhook_events(received_at desc);
create index idx_whatsapp_webhook_events_processing_status on public.whatsapp_webhook_events(processing_status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.whatsapp_auto_responder_config enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_leads enable row level security;
alter table public.whatsapp_webhook_events enable row level security;

-- whatsapp_leads: vendors read only leads routed to their organization;
-- admins read all. Matches the public.leads "members read own leads" pattern.
create policy "members read own whatsapp leads" on public.whatsapp_leads
for select using (app_private.is_org_member(vendor_id) or app_private.is_platform_admin());

-- admins read all whatsapp leads (explicit full-read policy per design).
create policy "admins read all whatsapp leads" on public.whatsapp_leads
for select using (app_private.is_platform_admin());

-- whatsapp_conversations: vendors read only conversations routed to their
-- organization; admins read all.
create policy "members read own whatsapp conversations" on public.whatsapp_conversations
for select using (app_private.is_org_member(vendor_id) or app_private.is_platform_admin());

-- whatsapp_auto_responder_config: admin-only (service role bypasses RLS).
create policy "admins read whatsapp config" on public.whatsapp_auto_responder_config
for select using (app_private.is_platform_admin());

create policy "admins manage whatsapp config" on public.whatsapp_auto_responder_config
for all using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

-- whatsapp_webhook_events: admin-only read (service role bypasses RLS).
create policy "admins read whatsapp webhook events" on public.whatsapp_webhook_events
for select using (app_private.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Seed default configuration (single row)
-- ---------------------------------------------------------------------------

insert into public.whatsapp_auto_responder_config (
  id,
  enabled,
  cooldown_minutes,
  in_hours_message,
  away_message,
  business_hours,
  routing_default_email
) values (
  true,
  true,
  60,
  'Thanks for messaging us! Our team has received your enquiry and will get back to you shortly during business hours.',
  'Thanks for your message! We are currently closed. Our hours are Monday to Friday, 9:00am to 5:00pm (Perth time). We will respond as soon as we reopen.',
  jsonb_build_object(
    'timezone', 'Australia/Perth',
    'days', jsonb_build_object(
      'monday',    jsonb_build_object('open', '09:00', 'close', '17:00'),
      'tuesday',   jsonb_build_object('open', '09:00', 'close', '17:00'),
      'wednesday', jsonb_build_object('open', '09:00', 'close', '17:00'),
      'thursday',  jsonb_build_object('open', '09:00', 'close', '17:00'),
      'friday',    jsonb_build_object('open', '09:00', 'close', '17:00'),
      'saturday',  null,
      'sunday',    null
    )
  ),
  'support@example.com'
)
on conflict (id) do nothing;
