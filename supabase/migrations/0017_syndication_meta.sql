-- ─────────────────────────────────────────────────────────────────────────────
-- 0017  Meta Syndication additions (Sprint 5)
-- Adds webhook ingestion queues and lead deduplication properties.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Webhook Ingestion Queue
-- To meet Meta's 5s response requirement (failure-modes.md F21), webhooks are 
-- inserted raw into this table and processed asynchronously.
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  channel_code text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index idx_webhook_events_pending on public.webhook_events(created_at) where status = 'pending';

alter table public.webhook_events enable row level security;
-- Webhooks are written by API endpoints using the service_role key, so no RLS for anon needed.
create policy "webhook_events staff read" on public.webhook_events
for select using (app_private.is_staff());

-- 2. Lead Deduplication
-- Leads need a channel_code and channel_lead_id for deduplication (failure-modes.md F21).
alter table public.leads add column channel_code text;
alter table public.leads add column channel_lead_id text;

-- Add partial unique index to enforce deduplication without constraining direct leads
create unique index idx_leads_channel_dedupe on public.leads(channel_code, channel_lead_id) 
where channel_code is not null and channel_lead_id is not null;
