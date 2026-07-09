-- Update plan vehicle limits to match current pricing:
-- Starter: $0/mo, 10 vehicles
-- Growth: $49/mo, 20 vehicles
-- Pro: $99/mo, 50 vehicles

update public.plans set vehicle_limit = 10 where code = 'starter';
update public.plans set vehicle_limit = 20 where code = 'growth';
update public.plans set vehicle_limit = 50 where code = 'pro';
