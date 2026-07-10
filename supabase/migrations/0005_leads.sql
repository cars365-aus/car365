-- ─────────────────────────────────────────────────────────────────────────────
-- 0005  Leads, the immutable event timeline, and follow-up reminders (SRS §14)
-- Leads are staff-only. Public submissions are inserted server-side via the
-- service-role client AFTER validation + rate-limit + Turnstile (there is no
-- anon/authenticated insert policy — buyers never touch this table directly,
-- and never read it since there are no buyer accounts).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  type public.lead_type not null,
  status public.lead_status not null default 'new',
  loss_reason public.lead_loss_reason,

  -- Contact
  name text not null,
  phone text not null,                                -- E.164 normalized
  email text,
  message text,

  vehicle_id uuid references public.vehicles(id) on delete set null,
  -- Type-specific fields (inspection slot, finance figures, trade-in car
  -- details, sell-your-car photo ids, waitlist interest, …). Keeps the schema
  -- stable across the 8 lead types (SRS §18.4).
  payload jsonb not null default '{}'::jsonb,

  -- Attribution (SRS §14.1)
  source_url text,
  utm jsonb not null default '{}'::jsonb,
  referrer text,
  device public.device_type,
  ip_hash text,                                       -- salted hash, never raw IP
  consent jsonb not null default '{}'::jsonb,

  -- Pipeline
  assignee_id uuid references public.profiles(id),
  first_contacted_at timestamptz,
  closed_at timestamptz,
  duplicate_of uuid references public.leads(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_type on public.leads(type);
create index idx_leads_created_at on public.leads(created_at desc);
create index idx_leads_phone on public.leads(phone);
create index idx_leads_vehicle on public.leads(vehicle_id);
create index idx_leads_new on public.leads(created_at) where status = 'new';

-- Immutable per-lead timeline (SRS §15.3): created / status_changed / note /
-- reminder_set / assigned / notified / exported.
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event text not null check (event in (
    'created', 'status_changed', 'note', 'reminder_set',
    'assigned', 'notified', 'exported'
  )),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_lead_events_lead on public.lead_events(lead_id, created_at);

create table public.lead_reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  due_at timestamptz not null,
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_lead_reminders_due on public.lead_reminders(due_at) where done = false;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_reminders enable row level security;

-- Staff-only for select/update/delete. No insert policy for anon/authenticated:
-- all inserts go through the service-role client in the lead API route.
create policy "leads staff read" on public.leads
for select using (app_private.is_staff());
create policy "leads staff update" on public.leads
for update using (app_private.is_staff()) with check (app_private.is_staff());
create policy "leads staff delete" on public.leads
for delete using (app_private.has_staff_role('owner', 'admin', 'manager'));

create policy "lead_events staff read" on public.lead_events
for select using (app_private.is_staff());
create policy "lead_events staff insert" on public.lead_events
for insert with check (app_private.is_staff());

create policy "lead_reminders staff all" on public.lead_reminders
for all using (app_private.is_staff()) with check (app_private.is_staff());
