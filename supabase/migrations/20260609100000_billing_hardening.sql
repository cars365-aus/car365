-- Billing Hardening Migration

alter table public.subscriptions 
  add column billing_interval text check (billing_interval in ('monthly', 'quarterly', 'yearly')),
  add column cancel_at_period_end boolean not null default false,
  add column canceled_at timestamptz,
  add column current_period_start timestamptz;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  amount_due integer not null,
  amount_paid integer not null,
  currency text not null,
  status text not null,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "org members read invoices" on public.invoices
for select using (app_private.is_org_member(organization_id) or app_private.is_platform_admin());
