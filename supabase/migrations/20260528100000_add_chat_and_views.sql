-- Add views tracking table
create table public.vehicle_views (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  ip_hash text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Add views count cache to vehicles
alter table public.vehicles add column views_count integer not null default 0;

-- Function to increment views
create or replace function public.increment_vehicle_view(p_vehicle_id uuid, p_ip_hash text default null, p_user_id uuid default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Only insert if we haven't seen this IP/User in the last hour for this vehicle (basic debouncing)
  if not exists (
    select 1 from public.vehicle_views
    where vehicle_id = p_vehicle_id
      and (
        (p_ip_hash is not null and ip_hash = p_ip_hash) or
        (p_user_id is not null and user_id = p_user_id)
      )
      and created_at > now() - interval '1 hour'
  ) then
    -- Record the view
    insert into public.vehicle_views (vehicle_id, ip_hash, user_id)
    values (p_vehicle_id, p_ip_hash, p_user_id);
    
    -- Increment the cache
    update public.vehicles
    set views_count = views_count + 1
    where id = p_vehicle_id;
  end if;
end;
$$;

revoke all on function public.increment_vehicle_view(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.increment_vehicle_view(uuid, text, uuid) to service_role;

-- Add messages table for chat
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.vehicle_views enable row level security;
alter table public.messages enable row level security;

-- Policies for vehicle_views
create policy "admins read all views" on public.vehicle_views
for select using (app_private.is_platform_admin());

create policy "org members read own vehicle views" on public.vehicle_views
for select using (
  exists (
    select 1 from public.vehicles v 
    where v.id = vehicle_id and app_private.is_org_member(v.organization_id)
  )
);

-- Policies for messages
create policy "users can read messages for their leads" on public.messages
for select using (
  exists (
    select 1 from public.leads l 
    where l.id = lead_id 
    and (
      l.customer_email = (select email from public.profiles where id = auth.uid()) 
      or app_private.is_org_member(l.vendor_id)
      or app_private.is_platform_admin()
    )
  )
);

create policy "users can insert messages for their leads" on public.messages
for insert with check (
  sender_user_id = auth.uid()
  and exists (
    select 1 from public.leads l 
    where l.id = lead_id 
    and (
      l.customer_email = (select email from public.profiles where id = auth.uid()) 
      or app_private.is_org_member(l.vendor_id)
    )
  )
);

-- Update vehicle policy to enforce monetization (Subscription required)
drop policy if exists "public read approved vehicles" on public.vehicles;

create policy "public read approved vehicles" on public.vehicles
for select using (
  (
    status = 'approved'
    and exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'approved')
    and exists (select 1 from public.branches b where b.id = branch_id and b.status = 'approved')
    and exists (
      select 1 from public.subscriptions s 
      where s.organization_id = vehicles.organization_id 
      and s.status in ('active', 'trialing')
    )
  )
  or app_private.is_org_member(organization_id)
  or app_private.is_platform_admin()
);
