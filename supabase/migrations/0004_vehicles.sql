-- ─────────────────────────────────────────────────────────────────────────────
-- 0004  Vehicles (core inventory) + images, features, price history, stats
-- Full field dictionary per SRS §13.1 / §18.1.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  stock_id text not null unique,                     -- e.g. A1042; shown to buyers
  slug text not null unique,                         -- {year}-{make}-{model}-{variant}-{stock_id}
  make_id uuid not null references public.makes(id),
  model_id uuid not null references public.models(id),
  variant text,
  year integer not null check (year between 1980 and extract(year from now())::int + 1),

  -- Condition / mechanical
  mileage_km integer not null check (mileage_km between 0 and 1000000),
  fuel_type public.fuel_type not null,
  transmission public.transmission_type not null,
  body_type public.body_type not null,
  drive_type public.drive_type,
  engine text,
  power_kw integer check (power_kw is null or power_kw between 1 and 2000),
  seats integer check (seats is null or seats between 1 and 12),
  doors integer check (doors is null or doors between 1 and 6),
  exterior_color text,
  interior text,

  -- Compliance. VIN is sensitive (SRS §20): protected at rest by Supabase disk
  -- encryption, and never included in the public query layer's SELECT list
  -- (public payloads expose at most the masked last-6). Full VIN is admin-only.
  vin text,
  registration text,
  rego_expiry date,

  -- Commercial
  price numeric(10,2) not null check (price > 0),
  previous_price numeric(10,2),
  price_changed_at timestamptz,
  weekly_estimate numeric(10,2),                     -- indicative finance figure

  -- Narrative / trust
  description text,
  safety_rating text,
  warranty_text text,
  roadworthy_included boolean not null default false,
  finance_available boolean not null default true,
  trade_in_welcome boolean not null default true,
  inspection_available boolean not null default true,

  -- Lifecycle / merchandising
  status public.vehicle_status not null default 'draft',
  is_featured boolean not null default false,
  featured_order integer,
  location_id uuid references public.locations(id),
  dealer_notes text,                                 -- internal only, never rendered
  seo_title text,
  seo_description text,
  published_at timestamptz,
  sold_at timestamptz,
  views_count integer not null default 0,

  search_tsv tsvector generated always as (
    to_tsvector('english',
      coalesce(variant, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(exterior_color, '') || ' ' ||
      coalesce(engine, ''))
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes (SRS §18.2)
create index idx_vehicles_status on public.vehicles(status);
create index idx_vehicles_make_model on public.vehicles(make_id, model_id);
create index idx_vehicles_body_type on public.vehicles(body_type);
create index idx_vehicles_price on public.vehicles(price);
create index idx_vehicles_year on public.vehicles(year);
create index idx_vehicles_mileage on public.vehicles(mileage_km);
create index idx_vehicles_published_at on public.vehicles(published_at desc);
create index idx_vehicles_available_price on public.vehicles(price) where status = 'available';
create index idx_vehicles_search_tsv on public.vehicles using gin(search_tsv);
create index idx_vehicles_variant_trgm on public.vehicles using gin(variant gin_trgm_ops);

-- Ordered gallery images (first / is_cover = card image).
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  media_id uuid not null references public.media_assets(id),
  sort_order integer not null default 0,
  alt_text text,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (vehicle_id, sort_order)
);
create index idx_vehicle_images_vehicle on public.vehicle_images(vehicle_id);

create table public.vehicle_features (
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  primary key (vehicle_id, feature_id)
);

-- Immutable price-change log, maintained by trigger below.
create table public.vehicle_price_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  old_price numeric(10,2),
  new_price numeric(10,2) not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);
create index idx_price_history_vehicle on public.vehicle_price_history(vehicle_id);

-- Pre-aggregated per-vehicle daily funnel (SRS §18.1) — powers reports without
-- hammering GA.
create table public.vehicle_daily_stats (
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date date not null,
  views integer not null default 0,
  cta_clicks jsonb not null default '{}'::jsonb,   -- {call: n, whatsapp: n, ...}
  leads integer not null default 0,
  primary key (vehicle_id, date)
);

-- ── Price-change trigger: keep previous_price / price_changed_at accurate and
-- append to vehicle_price_history whenever price changes. ─────────────────────
create or replace function public.handle_vehicle_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.price is distinct from old.price then
    new.previous_price := old.price;
    new.price_changed_at := now();
    insert into public.vehicle_price_history (vehicle_id, old_price, new_price, changed_by)
    values (new.id, old.price, new.price, auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_vehicle_price_change
before update on public.vehicles
for each row execute function public.handle_vehicle_price_change();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_features enable row level security;
alter table public.vehicle_price_history enable row level security;
alter table public.vehicle_daily_stats enable row level security;

-- Public sees anything that has been published and not archived (available,
-- reserved, and recently-sold cars stay briefly listed per SRS §13.2). Draft
-- and archived are staff-only; the 7-day/60-day delisting is enforced in the
-- app/query layer + the redirects table, not RLS.
create policy "vehicles public read published" on public.vehicles
for select using (
  status in ('available', 'reserved', 'sold') or app_private.is_staff()
);
create policy "vehicles staff manage" on public.vehicles
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "vehicle_images follow vehicle read" on public.vehicle_images
for select using (
  app_private.is_staff() or exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.status in ('available', 'reserved', 'sold')
  )
);
create policy "vehicle_images staff manage" on public.vehicle_images
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "vehicle_features follow vehicle read" on public.vehicle_features
for select using (
  app_private.is_staff() or exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.status in ('available', 'reserved', 'sold')
  )
);
create policy "vehicle_features staff manage" on public.vehicle_features
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "price_history staff read" on public.vehicle_price_history
for select using (app_private.is_staff());

create policy "daily_stats staff read" on public.vehicle_daily_stats
for select using (app_private.is_staff());
