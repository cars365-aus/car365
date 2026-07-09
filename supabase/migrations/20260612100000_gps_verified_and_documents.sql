alter table public.organizations
  add column if not exists gps_verified boolean not null default false;

comment on column public.organizations.gps_verified is
  'Admin-verified GPS tracking eligibility for Growth/Pro GPS Verified badge.';
