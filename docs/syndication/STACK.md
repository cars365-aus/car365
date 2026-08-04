# STACK.md — Task 0 artefact 1

Detected stack for the Cars 365 platform, verified against the repository (not assumed).

## Core

| Concern | Detected |
|---|---|
| Language | TypeScript 5 (strict), ESM |
| Framework | **Next.js 16.2.6**, App Router, React 19.2.4, Turbopack |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), design tokens in `src/app/globals.css` |
| UI primitives | `@base-ui/react`, `class-variance-authority`, `lucide-react`, local `src/components/ui/*` |
| Database | **Supabase (Postgres) with RLS** |
| ORM | **None.** Raw Supabase JS client (`@supabase/supabase-js` v2), deliberately untyped — rows are `any` at the data boundary and shaped into domain types in `src/lib/data/*` |
| Migration tool | **Plain forward-only SQL files**, `supabase/migrations/NNNN_name.sql` (currently `0001`–`0013`), applied with `supabase db push`. No down-migrations exist. |
| Job/cron | **No scheduler.** `vercel.json` contains `{"crons": []}`. One cron-shaped route exists (`src/app/api/cron/reminders/route.ts`) and fail-closes on a `CRON_SECRET` bearer token; it must be driven by an external scheduler. Two Supabase Edge Functions exist (`search-index-worker`, `lead-cleanup`), the first driven off a `search_index_jobs` table. |
| Queue | **None.** The closest existing pattern is the `search_index_jobs` table + edge-function worker — that is the precedent to follow for syndication jobs ("Postgres-backed job queue over a broker"). |
| Test runner | **Vitest 4** + jsdom + Testing Library; property tests with `fast-check` in `src/__tests__/properties/` |
| Lint | ESLint 9 (`eslint-config-next`), **zero-warnings policy — warnings fail CI** |
| Auth model | Supabase Auth. Admin access = env allowlist **OR** `app_metadata.platform_role` **OR** active `admin_roles` row. Guards in `src/lib/security/auth.ts`. Postgres RLS is the real backstop. |
| Deployment | Vercel (`vercel.json`, `@vercel/analytics`, `@vercel/speed-insights`) |
| Env convention | Plain `process.env` behind thin helpers in `src/lib/config.ts` (`requireEnv`, `optionalEnv`, `getAppUrl`). `@t3-oss/env-nextjs` is in `package.json` but **is not imported anywhere** — do not assume schema-validated env. `.env*` is gitignored; `.env.example` is the documented contract. |
| Error tracking | `@sentry/nextjs` |
| Email | `nodemailer` over AWS SES SMTP (`src/lib/email/ses.ts`); no-ops when SMTP env is unset |
| Rate limiting | `ioredis` (`src/lib/security/rate-limit-redis.ts`), falls back to in-memory with a loud prod warning |
| Search | Typesense, kept in sync by the `search-index-worker` edge function |

## Commands

```bash
npm install                       # install
npm run dev                       # dev server (localhost:3000)
npm run build                     # production build
npm run lint                      # ESLint — warnings fail CI
npx tsc --noEmit                  # typecheck (not an npm script; required by CI)
npm run test                      # Vitest, single run
npm run test:watch                # Vitest watch
npx vitest run src/lib/finance.test.ts        # single test file
npx vitest run -t "name substring"            # single test by name
supabase db push                  # apply migrations in supabase/migrations/
```

CI (`.github/workflows/ci.yml`) runs `lint` → `tsc --noEmit` → `test`. The `build` job is opt-in behind repo variable `RUN_BUILD=true` (needs live Supabase secrets).

**Creating a migration:** there is no generator. Add the next numbered file by hand:
`supabase/migrations/0014_syndication_core.sql`.

## Folder conventions to match

```
src/app/(public)/          public buyer site
src/app/admin/             staff control room
src/app/api/               route handlers, webhooks, cron
src/app/actions/           route-adjacent Server Actions
src/lib/data/              read-side data access, grouped by concern
src/lib/validation/        Zod schemas — every Server Action and API route validates through these
src/lib/security/          auth, allowlist, rate limiting, Turnstile, geo-restriction
src/lib/seo/               metadata, JSON-LD, indexation policy
src/proxy.ts               edge request gate (was middleware.ts — see note below)
supabase/migrations/       forward-only SQL
supabase/functions/        Deno edge functions
```

Naming: **camelCase in TypeScript, snake_case in Postgres.** Data functions convert explicitly at the boundary. Co-located `*.test.ts` next to the code under test.

## Notes that affect syndication work

1. **`src/proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention, and it must sit next to `app/` (so inside `src/`). A root-level `middleware.ts` is silently ignored. Any new request-layer behaviour goes here.
2. **`createAdminClient()` bypasses RLS.** Only call it after authorization is already checked. The syndication projection will need it; scope every query by dealer even though there is one dealer today.
3. **The Supabase client is untyped by choice.** Do not introduce generated `Database` types for syndication alone — match the existing `any`-at-the-boundary-then-shape pattern, with the `eslint-disable` header comment the existing data modules use.
4. **There is no multi-tenancy.** `architecture.md` assumes `dealer_id` throughout. There is no `dealers` table; the closest concepts are the `locations` table and the `company_profile` settings key. See PLAN.md for the recommended resolution.
5. **No background job runner exists.** Sprint 1 must decide the mechanism before any sync engine work.
