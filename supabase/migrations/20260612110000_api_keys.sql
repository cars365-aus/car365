create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null default 'Default',
  key_hash text not null unique,
  key_prefix text not null,
  revoked boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_org_idx on public.api_keys(organization_id);

alter table public.api_keys enable row level security;

create policy "service role manages api keys" on public.api_keys
  for all using (true) with check (true);
