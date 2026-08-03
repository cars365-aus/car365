# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this project is

**cars365** (`package.json` name `cars365-app`) — a **single-company used-car SALES lead-generation website** for the Australian market. It is NOT a booking/rental platform and NOT multi-tenant. There are no buyer accounts: the public site shows vehicles **for sale**, and visitors convert by submitting **enquiries/leads** (forms, WhatsApp click-to-chat, contact). Staff manage inventory and the leads pipeline through an internal `admin` panel.

> **History / doc drift:** this repo was pivoted from an earlier multi-tenant car-**rental** SaaS. That pivot is complete and merged to `main`. Several docs and some code strings still reflect the old product — treat them as stale:
> - `README.md` and `docs/ARCHITECTURE.md` still describe a multi-tenant rental marketplace with `customer`/`vendor` portals, Stripe payments, Resend email, and Upstash Redis. **None of that is true anymore** (see below). `Used-Car-Marketplace-SRS-BRD.docx` is the product source of truth.
> - Lingering legacy terminology (e.g. "rental lead", "vendor reminder" functions in `src/lib/email/ses.ts`) survives in code even though the product is now sales-only. Don't take those strings as evidence of rental features.
> - When docs and code disagree, **trust the code**.

## Commands

```bash
npm run dev            # Next.js dev server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint — zero-warnings policy (see CI note)
npx tsc --noEmit       # Typecheck (not an npm script, but required by CI)
npm run test           # Vitest, single run
npm run test:watch     # Vitest watch mode
npx vitest run src/lib/finance.test.ts     # Single test file
npx vitest run -t "test name substring"    # Single test by name
supabase db push       # Apply SQL migrations in supabase/migrations/
```

CI (`.github/workflows/ci.yml`) runs `lint` → `tsc --noEmit` → `test` on every PR/push to `master`/`main`. The `build` job is opt-in (needs live Supabase secrets) and only runs when the repo variable `RUN_BUILD=true` is set. **ESLint warnings (including unused vars/imports) fail CI** — run lint/typecheck/test locally before opening a PR.

## Architecture

Next.js 16 App Router (React 19, Tailwind v4) on Supabase (Postgres + Auth + RLS), with Typesense search, `ioredis`-backed rate limiting, Cloudflare Turnstile, and email over SMTP via `nodemailer` (AWS SES SMTP).

### Two application boundaries under `src/app`
- **`(public)`** — the unauthenticated buyer site: SEO/marketing pages plus `used-cars` (inventory + search), `sell-your-car`, `trade-in`, `finance`, `contact`, `testimonials`, `messages`, `faq`, etc. This is where leads are captured.
- **`admin`** — internal staff control room: `inventory`, `leads`, `catalogue`, `testimonials`, `faqs`, `roles`, `settings`, `audit`. Sign-in is at `admin-login`.

Supporting route groups: `auth` (Supabase auth callbacks/sign-in), `api` (route handlers & webhooks), `actions` (route-adjacent Server Actions), `offline` (PWA fallback). There is **no** `customer` or `vendor` boundary — if you see references to them anywhere, they're stale.

### Request enforcement (`src/proxy.ts`)
The first enforcement layer, in order: (1) hard-block known bad-actor bots by UA while never blocking legit SEO/social crawlers; (2) **geo-restrict the site to AU + IN** (see `src/lib/security/geo-restriction.ts`); (3) 403 mutation requests to `/api/*` with a missing/suspiciously-short UA; (4) inject `X-Robots-Tag: noindex` on `/api`, `/admin`, `/auth` and strip fingerprinting headers; (5) redirect `/?code=` OAuth codes to `/auth/callback`; (6) 301 lowercase-canonicalize `/locations/*` and `/categories/*` (SEO). **Only `/admin` (except `/admin-login`) is auth-protected** — everything else is public and skips the Supabase session check for performance. Admin authorization is checked here AND at the route layer (defense-in-depth); Postgres RLS is the real backstop (a misauthorized query returns 0 rows, not an error).

> **File location matters.** Next resolves this convention *next to the `app` directory*. Because `app` lives in `src/`, the file must be `src/proxy.ts` — a root-level `middleware.ts` is silently ignored and **none of these rules run** (that was the case in this repo until it was moved). Next 16 also renamed `middleware` → `proxy`; the exported function is `proxy`.

### Auth/authorization helpers (`src/lib/security/auth.ts`)
Admin access = allowlisted email (`src/lib/security/admin-allowlist.ts`) **OR** `app_metadata.platform_role` in {owner, admin, moderator} **OR** an active row in the `admin_roles` table. Guards:
- Redirect-based (Server Components/Actions): `requireUser()`, `requireAdmin()`, `requireAdminRole(roles)`.
- `NextResponse`-returning (route handlers): `requireApiUser()`, `requireApiAdmin()`.
`getCurrentUser()`/`userHasAdminAccess()` are `react.cache`-wrapped for per-request dedup.

### Data & business-logic layout
- `src/lib/supabase/{client,server,admin}.ts` — three clients (browser, SSR/server-component, service-role admin). `createAdminClient()` **bypasses RLS** — only call it after authorization is already checked.
- `src/lib/data/` — read-side data access, grouped by concern: `admin.ts`, `public.ts`, `inventory.ts`, `leads.ts`, `dashboard.ts`, `featured.ts`, `content.ts`, `locations.ts`, `settings.ts`, `redirects.ts`.
- `src/lib/leads/` — the lead lifecycle: `submit.ts`, `spam-check.ts`, `notify.ts`, `status.ts`.
- `src/lib/validation/` — Zod schemas (`vehicle.ts`, `lead.ts`, `newsletter.ts`, `content.ts`, `admin.ts`, `schemas.ts`). **Every Server Action and API route must validate input through these.**
- `src/lib/security/` — `auth.ts`, `admin-allowlist.ts`, `rate-limit.ts` / `rate-limit-redis.ts` (ioredis; falls back to in-memory with a loud prod warning when `REDIS_URL` is unset), `turnstile.ts`.
- `src/lib/email/ses.ts` — transactional email via `nodemailer` SMTP (AWS SES). No-ops when SMTP env is unset.
- `src/lib/search/typesense.ts` — Typesense query/config; the index is kept in sync by the `supabase/functions/search-index-worker` edge function driven off the `search_index_jobs` table.
- `src/lib/seo/` — large surface: JSON-LD (`jsonld.ts`), sitemap/discovery, slug canonicalization, cache invalidation on vehicle changes. SEO is a first-class product concern here.
- `src/lib/whatsapp.ts` — **just** phone normalization + `wa.me` click-to-chat link building (AU number handling). It is **not** a bot/webhook (the old inbound WhatsApp auto-responder was removed in the pivot).
- Server Actions live route-locally (`src/app/**/actions.ts`, `src/app/actions/`) or shared in `src/lib/actions/`. Prefer Server Actions; reserve `src/app/api/*` for webhooks, cron, and the public REST endpoints under `api/v1/` (`leads`, `newsletter`, `cta-clicks`).

### Cron
`src/app/api/cron/reminders/route.ts` sends staff reminder emails (pending inventory, unread leads). It fail-closes on a `CRON_SECRET` bearer token — if the secret is unset, the endpoint refuses all calls. Note `vercel.json` currently registers **no** crons, so this must be triggered by an external scheduler if desired.

### Database
Postgres via Supabase with RLS. Migrations are **forward-only SQL files** in `supabase/migrations/` (`0001`–`0013`) — never edit schema via the Supabase dashboard; always add a new numbered file. Core tables reflect the sales/lead model: `vehicles` (+ `vehicle_images`, `vehicle_features`, `vehicle_price_history`, `vehicle_daily_stats`), `makes`/`models`/`locations`/`features` (reference data), `leads` (+ `lead_events`, `lead_reminders`), `profiles`/`admin_roles`/`activity_logs` (staff & audit), `testimonials`, `newsletter_subscribers`, `faqs`/`pages`/`redirects`/`settings` (CMS-ish content), `chat_threads`/`chat_messages` + `bids` (buyer↔staff messaging), `search_index_jobs`. See `docs/DATABASE.md` for detail (verify against migrations — docs may lag).

### `.kiro/specs/`
Spec-driven-development artifacts (requirements/design/tasks) for past and in-flight features — useful background when working in an area with a matching spec folder.

## Testing notes
Vitest with jsdom + Testing Library. Property-based tests (fast-check) live under `src/__tests__/properties/`. Co-located `*.test.ts` files sit next to the code they cover (e.g. `src/lib/finance.test.ts`, `src/lib/vehicle-badges.test.ts`, `src/lib/security/admin-allowlist.test.ts`).
