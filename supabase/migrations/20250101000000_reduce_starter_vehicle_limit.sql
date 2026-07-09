-- Reduce Starter plan vehicle limit from 10 to 5.
-- Free-tier usage is being constrained to incentivize upgrades.
-- Existing vendors exceeding the new limit will have excess vehicles auto-archived
-- by the archive-excess-starter-vehicles migration script.

UPDATE public.plans
SET vehicle_limit = 5
WHERE code = 'starter';
