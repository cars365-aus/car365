-- Drop NOT NULL constraints to allow optional fields from admin form
alter table public.vehicles alter column fuel_type drop not null;
alter table public.vehicles alter column transmission drop not null;
alter table public.vehicles alter column body_type drop not null;
