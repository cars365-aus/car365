-- Add a nullable avatar_url column to profiles so the profile sync can persist
-- the avatar URL provided by Google user metadata. Additive and idempotent:
-- it does not affect the existing "read own or admin" / "update own" RLS
-- policies, and profile upserts continue to run through the service-role
-- admin client which bypasses RLS.
alter table public.profiles add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'Public URL of the user avatar, sourced from auth provider metadata when present';
