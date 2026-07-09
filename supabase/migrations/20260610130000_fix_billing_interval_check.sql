-- Fix billing_interval CHECK constraint to match the application vocabulary.
--
-- The app (checkout, getPlanFromStripePrice, validation schema, webhook) only
-- ever writes 'monthly' or 'annual'. The original constraint
-- (20260609100000_billing_hardening.sql) allowed 'monthly'/'quarterly'/'yearly',
-- so every annual checkout violated the CHECK. That made the
-- checkout.session.completed upsert throw, the webhook return 500, and the
-- subscription row never get written — i.e. the plan was never assigned after a
-- confirmed payment.
--
-- This migration replaces the constraint with the correct allowed values and
-- backfills any legacy 'yearly' rows to 'annual'.

-- Normalize any pre-existing legacy values before re-applying the constraint.
update public.subscriptions
  set billing_interval = 'annual'
  where billing_interval = 'yearly';

update public.subscriptions
  set billing_interval = 'monthly'
  where billing_interval = 'quarterly';

alter table public.subscriptions
  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check
  check (billing_interval is null or billing_interval in ('monthly', 'annual'));
