create table if not exists public.saved_vehicles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

alter table public.saved_vehicles enable row level security;

create policy "users manage own saved vehicles" on public.saved_vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{"inquiryUpdates": true, "specialOffers": false}'::jsonb;
