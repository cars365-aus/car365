-- ─────────────────────────────────────────────────────────────────────────────
-- 0019  Update branch and inventory location from Granville to Lansvale
--
-- Official new address:
--   16 Hollywood Dr, Lansvale NSW 2166, Australia
--
-- Specifically targets Cars365's old Granville branch:
--   "Granville Branch" / "93 Parramatta Rd, Granville NSW 2142"
-- Preserves independent vendor locations in Granville.
-- Updates public.locations, enqueues search index re-indexing jobs,
-- and updates legacy branches table if present.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Update public.locations table specifically for Cars365's old Granville branch
update public.locations
set
  name = 'Lansvale Branch',
  slug = case when slug in ('granville', 'granville-branch', 'main-showroom') then 'lansvale-branch' else slug end,
  address = '16 Hollywood Dr',
  city = 'Lansvale',
  state = 'NSW',
  postcode = '2166',
  lat = -33.8967,
  lng = 150.9634,
  updated_at = now()
where
  -- Target Cars365's specific Granville showroom address or branch name
  address ilike '%93 parramatta%'
  or (address ilike '%parramatta%' and (city ilike '%granville%' or postcode = '2142'))
  or name in ('Granville Branch', 'Granville')
  or slug in ('granville', 'granville-branch');

-- Ensure there is at least one active Lansvale location row for Cars365
insert into public.locations (name, slug, address, city, state, postcode, lat, lng, hours, is_active)
select
  'Lansvale Branch',
  'lansvale-branch',
  '16 Hollywood Dr',
  'Lansvale',
  'NSW',
  '2166',
  -33.8967,
  150.9634,
  jsonb_build_object(
    'mon', '9:00-18:00', 'tue', '9:00-18:00', 'wed', '9:00-18:00',
    'thu', '9:00-18:00', 'fri', '9:00-18:00', 'sat', '9:00-17:00', 'sun', 'closed'
  ),
  true
where not exists (
  select 1 from public.locations where city = 'Lansvale' and is_active = true
);

-- 2. If legacy branches table exists (pre-pivot schema), update Cars365's branch as well
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'branches') then
    update public.branches
    set
      name = 'Lansvale Branch',
      city = 'Lansvale',
      state = 'NSW',
      latitude = -33.8967,
      longitude = 150.9634
    where
      name in ('Granville Branch', 'Granville')
      or name ilike '%granville branch%'
      or (
        exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'branches' and column_name = 'address')
        and address ilike '%93 parramatta%'
      );
  end if;
end $$;

-- 3. Enqueue search index jobs for Typesense so all vehicles assigned to the Lansvale branch are reindexed
insert into public.search_index_jobs (vehicle_id, operation, status)
select v.id, 'upsert', 'pending'
from public.vehicles v
where v.location_id in (
  select id from public.locations where city = 'Lansvale'
)
on conflict do nothing;
