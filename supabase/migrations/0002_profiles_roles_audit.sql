-- ─────────────────────────────────────────────────────────────────────────────
-- 0002  Staff identity, RBAC helpers, and the append-only activity log
-- Reconciles the SRS `users` table (§18) with Supabase Auth idioms: a
-- profiles row per auth.users, plus an admin_roles row granting staff access.
-- There are NO public/buyer accounts in this product — only staff authenticate.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row here == this profile is a staff member with the given role.
create table public.admin_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.staff_role not null,
  active boolean not null default true,
  -- MFA is mandatory for owner/admin/manager (SRS §20); optional for sales/content.
  mfa_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only audit trail (SRS §15.9). Written from server code via the
-- service-role client; never mutated or deleted.
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);
create index idx_activity_logs_created on public.activity_logs(created_at desc);

-- ── Authorization helpers ───────────────────────────────────────────────────
-- Any active admin_roles row grants staff access.
create or replace function app_private.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid() and active = true
  );
$$;

-- Fine-grained gate: does the current user hold one of the given roles?
-- owner/admin are treated as super-users and always pass.
create or replace function app_private.has_staff_role(variadic roles public.staff_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid()
      and active = true
      and (role in ('owner', 'admin') or role = any(roles))
  );
$$;

grant usage on schema app_private to authenticated, service_role;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles readable by self or staff" on public.profiles
for select using (id = auth.uid() or app_private.is_staff());

create policy "profiles updatable by self" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admin_roles readable by self or staff" on public.admin_roles
for select using (user_id = auth.uid() or app_private.is_staff());

-- Only owner/admin may grant, revoke, or change staff roles.
create policy "admin_roles managed by owner or admin" on public.admin_roles
for all using (app_private.has_staff_role('owner', 'admin'))
with check (app_private.has_staff_role('owner', 'admin'));

create policy "activity_logs readable by staff" on public.activity_logs
for select using (app_private.is_staff());
-- Writes are service-role only (no anon/authenticated insert policy).
