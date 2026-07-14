-- ─────────────────────────────────────────────────────────────────────────────
-- 0012 Bidding and Messaging
-- Supports buyer-side "Make an Offer" and in-app chat threads.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.bid_status as enum ('pending', 'accepted', 'rejected', 'countered', 'withdrawn');

-- Ensure profiles are automatically created for new users if the trigger is missing
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- It's safe to drop and recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bids Table
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  status public.bid_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bids_vehicle on public.bids(vehicle_id);
create index idx_bids_buyer on public.bids(buyer_id);
create index idx_bids_status on public.bids(status);

-- Chat Threads
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chat_threads_vehicle on public.chat_threads(vehicle_id);
create index idx_chat_threads_buyer on public.chat_threads(buyer_id);
create index idx_chat_threads_lead on public.chat_threads(lead_id);

-- Chat Messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null, -- Null means system message
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_thread on public.chat_messages(thread_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

-- ── RLS Policies ─────────────────────────────────────────────────────────────
alter table public.bids enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- Bids
create policy "bids readable by buyer or staff" on public.bids
for select using (buyer_id = auth.uid() or app_private.is_staff());

create policy "bids insertable by buyer" on public.bids
for insert with check (buyer_id = auth.uid());

create policy "bids updatable by staff or buyer" on public.bids
for update using (buyer_id = auth.uid() or app_private.is_staff());

-- Chat Threads
create policy "chat_threads readable by buyer or staff" on public.chat_threads
for select using (buyer_id = auth.uid() or app_private.is_staff());

create policy "chat_threads insertable by buyer" on public.chat_threads
for insert with check (buyer_id = auth.uid());

-- Chat Messages
create policy "chat_messages readable by thread participants or staff" on public.chat_messages
for select using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.buyer_id = auth.uid()
  ) or app_private.is_staff()
);

create policy "chat_messages insertable by participants or staff" on public.chat_messages
for insert with check (
  (sender_id = auth.uid() and exists (
    select 1 from public.chat_threads t
    where t.id = thread_id and t.buyer_id = auth.uid()
  )) or app_private.is_staff()
);

-- Triggers for updated_at
-- If update_updated_at_column does not exist, we'll create it
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_bids_updated_at
before update on public.bids
for each row execute function public.update_updated_at_column();

create trigger trg_chat_threads_updated_at
before update on public.chat_threads
for each row execute function public.update_updated_at_column();
