# Payment Architecture Audit Report

## 1. Stripe Key Handling & Environment Variables
- **Status**: Medium Risk
- **What exists**: `.env.local` supports `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and plan price IDs.
- **What is missing**: No native validation of env vars at startup. Missing quarterly price IDs (`STRIPE_PRICE_ID_STARTER_QUARTERLY`, etc.).
- **What is risky**: Lack of safe env validation utility could cause silent failures in production.

## 2. Frontend Payment Components
- **Status**: Low Risk
- **What exists**: Pricing pages and Billing dashboard (`/vendor/billing`).
- **What is missing**: No UI for viewing, generating, or downloading past invoices directly.
- **What is risky**: Displayed limits might desync if frontend trusts local state over the DB state synced by Stripe.

## 3. Backend Stripe Routes/API Handlers
- **Status**: High Risk
- **What exists**: `/api/billing/checkout` and `/api/billing/portal`.
- **What is broken/missing**:
  - The checkout route does not pass an existing `stripe_customer_id` if the organization already has one, leading to duplicate Stripe Customers.
  - Quarterly billing support is missing from the checkout creation payload.

## 4. Subscription & Plan Flows
- **Status**: High Risk
- **What exists**: Basic checkout creation, plan upgrades via portal, cancellation via portal.
- **What is missing**:
  - Explicit quarterly billing flow.
  - Graceful downgrade and cancellation at period end states are not explicitly reflected in the UI or database (missing `cancel_at_period_end`).
- **What is risky**: Users might not know their exact entitlement period if they cancel.

## 5. Webhook Implementation
- **Status**: Medium Risk
- **What exists**: Good idempotency using `stripe_webhook_events` table. Signature verification is implemented.
- **What is missing**: Handling of `invoice.paid`, `invoice.finalized` for explicit invoice generation and recording.
- **What is risky**: Duplicate webhooks might hit DB concurrently before transaction locks.

## 6. Database Billing Tables
- **Status**: High Risk
- **What exists**: `subscriptions`, `stripe_webhook_events`, `subscription_events`.
- **What is missing**:
  - `invoices` table.
  - Granular subscription fields: `billing_interval`, `cancel_at_period_end`, `canceled_at`, `current_period_start`.
- **Priority**: Must be fixed before production.

## 7. Security Vulnerabilities & Entitlements
- **Status**: Low Risk
- **What exists**: Supabase RLS policies are applied. Checkouts verify organization membership.
- **Priority**: Continue enforcing RLS on any new tables (`invoices`).

## 8. Missing Tests
- **Status**: Critical
- **What is missing**: No comprehensive automated tests for webhooks, checkout flows, or signature validation.

## Priority Summary
- **Critical**: Fix duplicate customer creation in checkout. Add `invoices` table and sync logic.
- **High**: Add quarterly billing support and env validation.
- **Medium**: Update Subscription table schema. Expand webhook coverage.
- **Low**: Add invoice download UI.
