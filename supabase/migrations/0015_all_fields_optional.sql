-- Drop NOT NULL constraints from core vehicle fields
alter table public.vehicles alter column make_id drop not null;
alter table public.vehicles alter column model_id drop not null;
alter table public.vehicles alter column year drop not null;
alter table public.vehicles alter column mileage_km drop not null;
alter table public.vehicles alter column price drop not null;

-- Update check constraints that assumed values were NOT NULL
-- Drop old year check
alter table public.vehicles drop constraint if exists vehicles_year_check;
-- Add new year check allowing null
alter table public.vehicles add constraint vehicles_year_check 
  check (year is null or year between 1980 and extract(year from now())::int + 1);

-- Drop old mileage check
alter table public.vehicles drop constraint if exists vehicles_mileage_km_check;
-- Add new mileage check allowing null
alter table public.vehicles add constraint vehicles_mileage_km_check 
  check (mileage_km is null or mileage_km between 0 and 1000000);

-- Drop old price check
alter table public.vehicles drop constraint if exists vehicles_price_check;
-- Add new price check allowing null
alter table public.vehicles add constraint vehicles_price_check 
  check (price is null or price > 0);
