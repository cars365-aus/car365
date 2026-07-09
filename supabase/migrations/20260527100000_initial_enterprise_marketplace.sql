create extension if not exists pgcrypto;

create schema if not exists app_private;

create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.member_role as enum ('owner', 'admin', 'manager', 'staff');
create type public.lead_status as enum ('new', 'contacted', 'converted', 'lost');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'moderator', 'support')),
  active boolean not null default true,
  mfa_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  abn text not null check (abn ~ '^[0-9]{11}$'),
  status public.approval_status not null default 'pending',
  billing_email text,
  website text,
  phone text,
  address text,
  verified_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  city text not null,
  state text not null,
  address text not null,
  phone text,
  whatsapp text,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.plans (
  code text primary key check (code in ('starter', 'growth', 'pro', 'business', 'enterprise')),
  name text not null,
  vehicle_limit integer,
  stripe_price_id text,
  contact_sales boolean not null default false
);

insert into public.plans (code, name, vehicle_limit, contact_sales)
values
  ('starter', 'Starter', 5, false),
  ('growth', 'Growth', 25, false),
  ('pro', 'Pro', 100, false),
  ('business', 'Business', 300, true),
  ('enterprise', 'Enterprise', null, true)
on conflict (code) do nothing;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code text not null references public.plans(code),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status public.subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  slug text not null unique,
  title text not null,
  make text not null,
  model text not null,
  year integer not null check (year between 1990 and 2030),
  seats integer not null check (seats between 2 and 12),
  fuel text not null,
  transmission text not null,
  category text not null,
  price_per_day_aud integer not null check (price_per_day_aud between 20 and 2000),
  status public.approval_status not null default 'pending',
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.vehicle_features (
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  feature text not null,
  primary key (vehicle_id, feature)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_city text not null,
  start_date date not null,
  end_date date not null,
  message text,
  status public.lead_status not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_user_id uuid references public.profiles(id),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.contact_clicks (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  channel text not null check (channel in ('phone', 'whatsapp')),
  ip_hash text,
  created_at timestamptz not null default now()
);

create table public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  city text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status public.approval_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index idx_reviews_lead_id_unique
on public.reviews(lead_id)
where lead_id is not null;

create table public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.moderation_notes (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid not null,
  author_user_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  event_type text not null,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  document_slug text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (organization_id, user_id, document_slug, version)
);

create table public.search_index_jobs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  operation text not null check (operation in ('upsert', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'complete', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  payload jsonb not null,
  processing_status text not null default 'processing' check (processing_status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text references public.stripe_webhook_events(id),
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function app_private.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and active = true
      and role in ('owner', 'admin', 'moderator', 'support')
  );
$$;

create or replace function app_private.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

create or replace function app_private.is_org_manager(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'manager')
  );
$$;

grant usage on schema app_private to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.branches enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_features enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.contact_clicks enable row level security;
alter table public.featured_placements enable row level security;
alter table public.vendor_documents enable row level security;
alter table public.reviews enable row level security;
alter table public.fraud_flags enable row level security;
alter table public.moderation_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.security_events enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.search_index_jobs enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.subscription_events enable row level security;

create policy "profiles read own or admin" on public.profiles
for select using (id = auth.uid() or app_private.is_platform_admin());

create policy "profiles update own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admin roles read own or admin" on public.admin_roles
for select using (user_id = auth.uid() or app_private.is_platform_admin());

create policy "public read approved organizations" on public.organizations
for select using (status = 'approved' or app_private.is_org_member(id) or app_private.is_platform_admin());

create policy "org managers update own organizations" on public.organizations
for update using (app_private.is_org_manager(id) or app_private.is_platform_admin())
with check (app_private.is_org_manager(id) or app_private.is_platform_admin());

create policy "members read own organization memberships" on public.organization_members
for select using (user_id = auth.uid() or app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "public read approved branches" on public.branches
for select using (status = 'approved' or app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "org managers manage branches" on public.branches
for all using (app_private.is_org_manager(organization_id) or app_private.is_platform_admin())
with check (app_private.is_org_manager(organization_id) or app_private.is_platform_admin());

create policy "plans are public" on public.plans
for select using (true);

create policy "members read subscriptions" on public.subscriptions
for select using (app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "public read approved vehicles" on public.vehicles
for select using (
  status = 'approved'
  and exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'approved')
  and exists (select 1 from public.branches b where b.id = branch_id and b.status = 'approved')
  or app_private.is_org_member(organization_id)
  or app_private.is_platform_admin()
);

create policy "org managers manage vehicles" on public.vehicles
for all using (app_private.is_org_manager(organization_id) or app_private.is_platform_admin())
with check (app_private.is_org_manager(organization_id) or app_private.is_platform_admin());

create policy "vehicle images follow vehicle access" on public.vehicle_images
for select using (
  exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id
      and (v.status = 'approved' or app_private.is_org_member(v.organization_id) or app_private.is_platform_admin())
  )
);

create policy "vehicle managers manage images" on public.vehicle_images
for all using (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and (app_private.is_org_manager(v.organization_id) or app_private.is_platform_admin()))
)
with check (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and (app_private.is_org_manager(v.organization_id) or app_private.is_platform_admin()))
);

create policy "vehicle features follow vehicle access" on public.vehicle_features
for select using (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.status = 'approved' or app_private.is_org_member(v.organization_id) or app_private.is_platform_admin()))
);

create policy "members read own leads" on public.leads
for select using (app_private.is_org_member(vendor_id) or app_private.is_platform_admin());

create policy "members update own lead status" on public.leads
for update using (app_private.is_org_member(vendor_id) or app_private.is_platform_admin())
with check (app_private.is_org_member(vendor_id) or app_private.is_platform_admin());

create policy "members read lead events" on public.lead_events
for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (app_private.is_org_member(l.vendor_id) or app_private.is_platform_admin()))
);

create policy "members read contact clicks" on public.contact_clicks
for select using (app_private.is_org_member(vendor_id) or app_private.is_platform_admin());

create policy "members read placements" on public.featured_placements
for select using (app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "members read own documents" on public.vendor_documents
for select using (app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "org managers upload document records" on public.vendor_documents
for insert with check (app_private.is_org_manager(organization_id) or app_private.is_platform_admin());

create policy "public read approved reviews" on public.reviews
for select using (status = 'approved' or app_private.is_org_member(organization_id) or app_private.is_platform_admin());

create policy "admins read fraud flags" on public.fraud_flags
for select using (app_private.is_platform_admin());

create policy "admins manage moderation notes" on public.moderation_notes
for all using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

create policy "admins read audit logs" on public.audit_logs
for select using (app_private.is_platform_admin());

create policy "admins read security events" on public.security_events
for select using (app_private.is_platform_admin());

create policy "members read legal acceptances" on public.legal_acceptances
for select using (app_private.is_org_member(organization_id) or user_id = auth.uid() or app_private.is_platform_admin());

create policy "members read search jobs" on public.search_index_jobs
for select using (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and (app_private.is_org_member(v.organization_id) or app_private.is_platform_admin()))
);

create policy "admins read stripe webhook events" on public.stripe_webhook_events
for select using (app_private.is_platform_admin());

create policy "admins read subscription events" on public.subscription_events
for select using (app_private.is_platform_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-images', 'vehicle-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('pending-vehicle-images', 'pending-vehicle-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-documents', 'vendor-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "public reads approved vehicle images" on storage.objects
for select using (bucket_id = 'vehicle-images');

create policy "org members manage pending vehicle images" on storage.objects
for all to authenticated
using (
  bucket_id in ('pending-vehicle-images', 'vehicle-images')
  and app_private.is_org_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id in ('pending-vehicle-images', 'vehicle-images')
  and app_private.is_org_member(((storage.foldername(name))[1])::uuid)
);

create policy "org members manage vendor documents" on storage.objects
for all to authenticated
using (
  bucket_id = 'vendor-documents'
  and app_private.is_org_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'vendor-documents'
  and app_private.is_org_member(((storage.foldername(name))[1])::uuid)
);

-- Atomic vendor onboarding function to prevent race conditions and partial state
-- This ensures all records are created together or none at all
create or replace function app_private.create_vendor_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_business_name text,
  p_slug text,
  p_abn text,
  p_website text,
  p_address text,
  p_city text,
  p_state text,
  p_branch_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
begin
  -- Create organization
  insert into public.organizations (name, slug, abn, billing_email, website, phone, address, status)
  values (p_business_name, p_slug, p_abn, p_email, p_website, p_phone, p_address, 'pending')
  returning id into v_organization_id;

  -- Create organization member
  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, p_user_id, 'owner');

  -- Create initial branch
  insert into public.branches (organization_id, name, slug, city, state, address, phone, status)
  values (v_organization_id, p_city || ' branch', p_branch_slug, p_city, p_state, p_address, p_phone, 'pending');

  -- Record legal acceptance
  insert into public.legal_acceptances (organization_id, user_id, document_slug, version)
  values (v_organization_id, p_user_id, 'vendor-agreement', 'vendor-agreement-v1');

  -- Log audit event
  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (p_user_id, 'vendor_onboarding_submitted', 'organization', v_organization_id, jsonb_build_object('source', 'vendor_onboarding_atomic'));

  return v_organization_id;
exception when others then
  -- Rollback happens automatically on exception in plpgsql
  raise exception 'Failed to create vendor onboarding: %', sqlerrm;
end;
$$;

create or replace function public.create_vendor_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_business_name text,
  p_slug text,
  p_abn text,
  p_website text,
  p_address text,
  p_city text,
  p_state text,
  p_branch_slug text
)
returns uuid
language sql
security invoker
set search_path = public, app_private
as $$
  select app_private.create_vendor_onboarding(
    p_user_id,
    p_full_name,
    p_email,
    p_phone,
    p_business_name,
    p_slug,
    p_abn,
    p_website,
    p_address,
    p_city,
    p_state,
    p_branch_slug
  );
$$;

revoke all on function public.create_vendor_onboarding(uuid, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_vendor_onboarding(uuid, text, text, text, text, text, text, text, text, text, text, text) to service_role;

-- Lead expiration function to auto-archive old leads
-- Run via cron job or pg_cron: SELECT cron.schedule('0 0 * * *', 'SELECT app_private.archive_old_leads()');
create or replace function app_private.archive_old_leads(
  p_days_old integer default 90
)
returns table (archived_count integer, deleted_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_archived integer := 0;
  v_deleted integer := 0;
  v_cutoff_date timestamptz;
begin
  v_cutoff_date := now() - (p_days_old || ' days')::interval;

  -- leads_archive is created as a proper migration (20260606100100_missing_indices_and_leads_archive.sql).
  -- No DDL inside the function.

  -- Move leads older than cutoff to archive
  with archived as (
    delete from public.leads
    where created_at < v_cutoff_date
      and status in ('new', 'contacted', 'lost')
    returning *
  )
  insert into public.leads_archive (
    id, vendor_id, vehicle_id, customer_name, customer_email, customer_phone,
    pickup_city, start_date, end_date, message, status, ip_hash, created_at, updated_at,
    archived_at, archive_reason
  )
  select 
    id, vendor_id, vehicle_id, customer_name, customer_email, customer_phone,
    pickup_city, start_date, end_date, message, status, ip_hash, created_at, updated_at,
    now(), 'expired after ' || p_days_old || ' days'
  from archived;

  get diagnostics v_archived = row_count;

  -- Log the archive action
  insert into public.audit_logs (action, resource_type, metadata)
  values ('leads_archived', 'system', jsonb_build_object(
    'archived_count', v_archived,
    'cutoff_days', p_days_old,
    'cutoff_date', v_cutoff_date
  ));

  return query select v_archived, v_deleted;
end;
$$;
