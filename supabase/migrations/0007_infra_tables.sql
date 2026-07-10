-- ─────────────────────────────────────────────────────────────────────────────
-- 0007  Infra: newsletter, redirects, settings, search-index outbox
-- ─────────────────────────────────────────────────────────────────────────────

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_at timestamptz not null default now(),
  source text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 301/302 map: sold/archived VDPs redirect to their model landing page
-- (SRS §13.2, §16.2). Resolved server-side (middleware / route handler).
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  code integer not null default 301 check (code in (301, 302, 307, 308, 410)),
  hits integer not null default 0,
  created_at timestamptz not null default now()
);

-- Key/value config (SRS §15.7): finance params, notification recipients,
-- phone numbers, company profile, legal text, blocked inspection dates.
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Outbox driving the Typesense sync worker (same pattern as the retired rental
-- schema). A trigger on vehicles enqueues upsert/delete jobs; the
-- search-index-worker edge function drains them.
create table public.search_index_jobs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  operation text not null check (operation in ('upsert', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index idx_search_jobs_pending on public.search_index_jobs(created_at) where status = 'pending';

create or replace function public.enqueue_search_index_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.search_index_jobs (vehicle_id, operation) values (old.id, 'delete');
    return old;
  else
    insert into public.search_index_jobs (vehicle_id, operation) values (new.id, 'upsert');
    return new;
  end if;
end;
$$;

create trigger trg_vehicles_search_index
after insert or update or delete on public.vehicles
for each row execute function public.enqueue_search_index_job();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.newsletter_subscribers enable row level security;
alter table public.redirects enable row level security;
alter table public.settings enable row level security;
alter table public.search_index_jobs enable row level security;

-- Newsletter subscribe goes through the service-role client in the API route
-- (validated + rate-limited), so no anon insert policy — staff read only.
create policy "newsletter staff read" on public.newsletter_subscribers
for select using (app_private.is_staff());

create policy "redirects staff manage" on public.redirects
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "settings staff read" on public.settings
for select using (app_private.is_staff());
create policy "settings staff write" on public.settings
for all using (app_private.has_staff_role('owner', 'admin', 'manager'))
with check (app_private.has_staff_role('owner', 'admin', 'manager'));

create policy "search_jobs staff read" on public.search_index_jobs
for select using (app_private.is_staff());
