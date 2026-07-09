-- Drop the insecure policy that allows users to arbitrarily update their profiles.
-- The browser client never needs direct UPDATE access since profile sync occurs 
-- securely via a server-side admin client.

drop policy if exists "profiles update own" on public.profiles;
