# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # Next.js dev server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint — zero warnings policy, see below
npx tsc --noEmit       # Typecheck (not a package.json script, but required by CI)
npm run test           # Vitest, single run (src/**/*.test.ts(x))
npm run test:watch     # Vitest watch mode
npx vitest run path/to/file.test.ts        # Single test file
npx vitest run -t "test name substring"    # Single test by name
supabase db push       # Apply SQL migrations in supabase/migrations/
```

CI (`.github/workflows/ci.yml`) runs `lint` → `tsc --noEmit` → `test` on every PR/push to `master`/`main`. The `build` job is opt-in (needs live Supabase secrets) and only runs when the repo variable `RUN_BUILD=true` is set. Before opening a PR, run lint/typecheck/test locally — **ESLint warnings (including unused vars/imports) fail CI**, not just errors.

## Architecture

Next.js 16 App Router app (React 19, Tailwind v4) backed by Supabase (Postgres + Auth + RLS), with Typesense search, Stripe billing, Upstash Redis rate limiting, Cloudflare Turnstile, and AWS SES for transactional email.

### Four application boundaries under `src/app`
- **`(public)`** — unauthenticated SEO/marketing/search pages.
- **`customer`** — renter dashboard (saved vehicles, enquiries).
- **`vendor`** — SaaS portal for rental operators (fleet, branches, leads, billing). Gated not just by auth but by org membership: `middleware.ts` redirects users with zero `organization_members` rows to `/vendor/upgrade` (see `isVendorPreOrgPath` in `src/lib/routing.ts` for the exempted pre-org paths).
- **`admin`** — internal control room (moderation, fraud review, platform settings).

`middleware.ts` is the first enforcement layer: it skips auth checks entirely for non-protected paths (perf optimization for public/SEO pages), then requires a valid Supabase session for `/customer`, `/vendor`, `/messages`, `/admin`. Admin access is layered — allowlisted email (`src/lib/security/admin-allowlist.ts`) OR `app_metadata.platform_role` OR an active `admin_roles` DB row. It also does strict lowercase-canonicalization 301 redirects for `/locations/*` and `/categories/*` (SEO).

### Auth/authorization helpers (`src/lib/security/auth.ts`)
Route/layout-level guards: `requireUser()`, `requireAdmin()`, `requireAdminRole(roles)` (redirect-based, for Server Components/Actions) and `requireApiUser()`/`requireApiAdmin()` (return a `NextResponse` instead of redirecting, for route handlers). Middleware duplicates the admin-check logic for defense-in-depth — RLS in Postgres is the actual backstop (a misauthorized query returns 0 rows, not an error).

### Data & business logic layout
- `src/lib/supabase/{client,server,admin}.ts` — three separate Supabase clients (browser, SSR/server-component, service-role admin). `createAdminClient()` bypasses RLS — only call it after authorization has already been checked.
- `src/lib/data/` — read-side data access functions grouped by boundary (`admin.ts`, `vendor.ts`, `public.ts`, `featured.ts`).
- `src/lib/validation/` — Zod schemas; every Server Action and API route must validate input through these.
- `src/lib/billing/` — Stripe integration (webhook handling has idempotency helpers in `claim-webhook-event.ts`).
- `src/lib/search/` — Typesense query/config; sync happens via `supabase/functions/search-index-worker`.
- `src/lib/whatsapp/` — WhatsApp Cloud API bot: inbound webhook handling, business-hours/cooldown logic, lead creation. Not covered in `/docs` — read this directory directly if touching it.
- `src/lib/ai/` — Gemini-backed content generation (blog posts/images, vehicle SEO copy, review/vehicle moderation).
- `src/lib/blog/` — blog publishing pipeline (`publish-daily.ts` is invoked by the Vercel cron in `vercel.json`, `/api/cron/daily-blog` at 18:00 UTC daily).
- Server Actions live in `src/app/[boundary]/.../actions.ts` (route-local) or `src/lib/actions/` (shared). Prefer Server Actions over `src/app/api/*`; reserve API routes for external webhooks (Stripe) and public REST endpoints.

**Known doc drift:** `README.md`/`docs/ARCHITECTURE.md` still say email is sent via Resend, but the codebase has migrated to AWS SES (`src/lib/email/ses.ts`); there's no live `resend.ts`, only a stale `resend.test.ts`. Trust the code over those two docs on this point.

### Database
Postgres via Supabase, RLS-enforced tenant isolation (vendors scoped by `organization_id`, customers see only `approved` listings). Core tables: `organizations`, `branches`, `vehicles`, `leads`, `subscriptions`, `admin_roles`, `organization_members`. Never edit schema via the Supabase dashboard — always add a forward-only SQL file to `supabase/migrations/`. See `docs/DATABASE.md` for the fuller schema and `docs/API.md`/`docs/SECURITY.md` for endpoint and auth-boundary details.

### `.kiro/specs/`
Spec-driven-development artifacts (requirements/design/tasks docs) for past and in-flight features — useful background when working in an area that has a matching spec folder there.

## Repository layout gotcha

This working tree lives at `.../hire-car-master/hire-car/` and is the canonical git checkout (tracks `origin/master`). A sibling directory, `.../hire-car-master/hire-car-master/`, is a separate, non-git, likely-stale copy of the same project (consistent with a GitHub "Download ZIP" extraction). Do not edit files there — changes won't be tracked or deployed.
