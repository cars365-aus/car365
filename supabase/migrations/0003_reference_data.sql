-- ─────────────────────────────────────────────────────────────────────────────
-- 0003  Reference data: locations (branches), media, makes/models, features
-- All public-readable, staff-managed. FK targets for vehicles in 0004.
-- ─────────────────────────────────────────────────────────────────────────────

-- Dealership branches. Multiple rows (multi-city per confirmed scope) — each
-- backs a /locations/{city} landing page and NAP block.
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  city text not null,
  state text not null,
  postcode text,
  phone text,
  whatsapp text,
  lat numeric(9,6),
  lng numeric(9,6),
  hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_locations_active on public.locations(is_active) where is_active = true;

-- Uploaded media originals + derived renditions. Not listed directly to the
-- public; consumed via vehicle_images / blog / testimonial joins.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null,
  mime text not null,
  width integer,
  height integer,
  bytes integer,
  renditions jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.makes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_media_id uuid references public.media_assets(id),
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.makes(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_id, slug)
);
create index idx_models_make on public.models(make_id);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category public.feature_category not null,
  created_at timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.locations enable row level security;
alter table public.media_assets enable row level security;
alter table public.makes enable row level security;
alter table public.models enable row level security;
alter table public.features enable row level security;

create policy "locations public read active" on public.locations
for select using (is_active or app_private.is_staff());
create policy "locations staff manage" on public.locations
for all using (app_private.is_staff()) with check (app_private.is_staff());

-- Media metadata is staff-only; public consumption is through the public
-- storage bucket + resolved URLs, not by listing this table.
create policy "media staff all" on public.media_assets
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "makes public read" on public.makes
for select using (true);
create policy "makes staff manage" on public.makes
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "models public read" on public.models
for select using (true);
create policy "models staff manage" on public.models
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "features public read" on public.features
for select using (true);
create policy "features staff manage" on public.features
for all using (app_private.is_staff()) with check (app_private.is_staff());
