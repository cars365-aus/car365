# Security Policy

## Required Before Production

- Replace all placeholder legal pages with lawyer-reviewed Australian documents.
- Confirm Supabase RLS policies with automated tests and Supabase advisors.
- Configure Cloudflare WAF, Turnstile, bot protection, and rate limits.
- Require MFA for all platform admins.
- Configure separate production/staging credentials for Supabase, Stripe, Resend, Typesense, and Vercel.
- Test Stripe webhook replay and invalid-signature rejection.
- Confirm Supabase backups and restore process.

## Secret Handling

Only `NEXT_PUBLIC_*` values may be exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `TYPESENSE_API_KEY` must stay server-only.
