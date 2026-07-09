# Requirements Document — Repository Audit & Fix Plan

## Introduction

This specification covers a full repository audit of the Carhire Marketplace (Next.js 16, Supabase, Stripe, Typesense, Resend) and a phased plan to fix every identified bug, security risk, architectural issue, performance problem, UX gap, and business loophole. The audit was performed by reading every source file in the repository. Fixes are organised into six safe, reviewable batches.

The system under audit is a Next.js App Router monolith with:
- **Public marketplace** — search, vehicle detail pages, vendor profiles, pricing, contact, legal
- **Vendor SaaS** — onboarding, branches, vehicles, leads, analytics, billing, settings
- **Admin console** — moderation, fraud, billing, audit logs
- **Platform services** — Supabase (auth + Postgres + RLS + Storage), Stripe subscriptions, Resend email, Typesense search, Cloudflare Turnstile, Vercel/Cloudflare deployment

### Build and Test Baseline

- `npm run build` — **passes** (0 errors, 22/22 static pages, TypeScript clean)
- `npm run test` — **passes** (2/2 tests in `schemas.test.ts`)

---

## Glossary

- **System** — the Carhire Next.js application
- **Vendor** — a car-hire operator who lists vehicles on the platform
- **Customer** — a member of the public who submits lead enquiries
- **Admin** — a platform operator with `platform_role = owner | admin | moderator` and MFA
- **Lead** — a customer enquiry for a specific vehicle
- **Organization** — the vendor's business entity in the database
- **Branch** — a physical location belonging to an Organization
- **Subscription** — a Stripe-backed plan record in the `subscriptions` table
- **RLS** — Row Level Security (Supabase Postgres)
- **Server Action** — a Next.js `"use server"` function called from a React form or component
- **API Route** — a Next.js `route.ts` handler under `src/app/api/`
- **Middleware** — `middleware.ts` at the project root, runs on every request
- **Turnstile** — Cloudflare bot-challenge widget
- **Redis** — optional distributed cache used for sliding-window rate limiting
- **Typesense** — search engine; falls back to Supabase full-text when not configured
- **Approval_Status** — enum: `pending | approved | rejected | suspended | draft | archived`
- **Search_Index_Job** — async queue record for Typesense synchronisation
- **Batch** — a group of related fixes executed and reviewed together

---

## Requirements

---

### Requirement 1 — Full Repository Audit Report

**User Story:** As a platform owner, I want a complete audit report that classifies every bug, security risk, and gap found in the live codebase, so that I know the exact state of the system before applying fixes.

#### Acceptance Criteria

1. THE System SHALL produce a structured audit report grouped by the ten audit domains: runtime bugs, security issues, auth/access control, API/backend correctness, database/data integrity, frontend/UX, performance, testing/reliability, deployment/environment, and product logic/business loopholes.
2. WHEN an issue is identified, THE Audit Report SHALL assign it a severity of Critical, High, Medium, Low, or Nice-to-have using the definitions in the Introduction.
3. THE Audit Report SHALL reference the exact file path and line range for each finding.
4. THE Audit Report SHALL include a summary table counting findings per severity per domain.
5. THE Audit Report SHALL identify whether a finding is a real bug (broken today), a latent risk (broken under specific conditions), or a missing feature (not yet built).

---

### Requirement 2 — Critical Findings (Batch 1)

**User Story:** As a platform owner, I want all critical security, payment, and build-blocking issues fixed first, so that the application cannot be compromised or rendered unusable before other batches run.

#### Acceptance Criteria

1. **[AUTH-001 — Middleware does not enforce route protection]**
   WHEN a request arrives at `/vendor/*` or `/admin/*`, THE Middleware SHALL redirect unauthenticated users to `/auth/sign-in` before the layout's `requireUser()` / `requireAdmin()` is reached, so that protected routes are gated at the network edge rather than only inside React Server Components.

2. **[AUTH-002 — Open redirect in auth callback]**
   WHEN the `next` query parameter in `/auth/callback` contains an external URL (e.g. `next=https://evil.com`), THE Auth Callback SHALL reject the redirect and fall back to `/vendor/dashboard`, so that the OAuth flow cannot be weaponised as an open redirector.

3. **[SEC-001 — Admin moderation `approve` links are GET requests without CSRF protection]**
   WHEN an admin clicks an "Approve" or "Reject" link in `/admin/page.tsx`, THE System SHALL use a form POST to `/api/admin/moderation` instead of a plain `<Link href="...?approve=...">`, so that moderation actions cannot be triggered by a malicious link or CSRF attack.

4. **[SEC-002 — Billing checkout missing organization ownership check]**
   WHEN a POST is made to `/api/billing/checkout`, THE Checkout API SHALL verify that the authenticated user is a member of the provided `organizationId` before creating a Stripe session, so that one vendor cannot start a subscription for another vendor's organisation.

5. **[SEC-003 — Billing portal missing ownership check]**
   WHEN a POST is made to `/api/billing/portal`, THE Portal API SHALL verify that the provided `stripeCustomerId` belongs to an organisation the authenticated user is a member of, so that a vendor cannot access another vendor's Stripe portal.

6. **[SEC-004 — `quick` lead API has no rate limit]**
   WHEN an authenticated user calls `POST /api/leads/quick`, THE Quick Lead API SHALL apply a per-user sliding-window rate limit (e.g. 10 per hour) to prevent bulk lead flooding from a single account.

7. **[SEC-005 — `contact-events` API does not validate vehicle/vendor relationship]**
   WHEN a POST is made to `/api/contact-events`, THE Contact Events API SHALL verify that the `vehicleId` belongs to the `vendorId` before inserting the click record, so that fake click events cannot be injected for arbitrary vendor/vehicle pairs.

8. **[SEC-006 — Delete vehicle uses an unprotected HTML form POST to `/api/vehicles/delete`]**
   WHEN a vendor clicks "Delete" on the vehicles page, THE System SHALL invoke the `deleteVehicle` Server Action directly (not a plain HTML form pointing to a non-existent API route `/api/vehicles/delete`), so that the delete operation is authenticated and the route 404 is eliminated.

9. **[SEC-007 — Sensitive PII logged in plain text]**
   WHEN a lead is rate-limited or blocked, THE Lead API SHALL NOT log the customer's raw email address in `console.info`; THE System SHALL log only a hashed or truncated identifier.

10. **[SEC-008 — Dev-only password sign-in buttons visible in production]**
    WHEN `NODE_ENV === "production"`, THE Sign-In Page SHALL NOT render the "Dev: Customer", "Dev: Vendor", and "Dev: Admin" password login buttons, so that hardcoded test credentials cannot be used in production.

---

### Requirement 3 — Auth & Access Control (Batch 2)

**User Story:** As a platform owner, I want all authentication flows, session handling, and role-based access checks to be complete and correct, so that vendors and admins cannot access resources that don't belong to them.

#### Acceptance Criteria

1. **[AUTH-003 — No server-side auth check on vendor API routes that use `createAdminClient`]**
   WHEN any vendor Server Action (`onboarding/actions.ts`, `vehicles/actions.ts`, `image-actions.ts`, `leads/actions.ts`, `branches/actions.ts`) calls `createAdminClient()`, THE Action SHALL already have verified via `requireUser()` and `ensureUserCanManageOrganization()` that the caller owns the resource, so that service-role database access is never exercised on behalf of an unverified caller.

2. **[AUTH-004 — `requireAdmin` relies on stale `app_metadata.aal` check in `userHasMfa`]**
   WHEN `requireAdmin()` is called, THE Auth Module SHALL use only the live `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` response to confirm `aal2`, and SHALL NOT additionally inspect `user.app_metadata.aal` which may be stale, so that MFA enforcement is always based on the current session assurance level.

3. **[AUTH-005 — Auth callback does not handle exchange errors]**
   WHEN `supabase.auth.exchangeCodeForSession(code)` returns an error in `/auth/callback`, THE Callback SHALL redirect to `/auth/sign-in?error=auth_failed` instead of silently continuing and redirecting to `next`, so that failed OAuth exchanges do not produce broken sessions.

4. **[AUTH-006 — Vendor layout does not guard against onboarding-incomplete state]**
   WHILE a user has completed OAuth sign-in but has no Organisation membership, THE Vendor Layout SHALL redirect to `/vendor/onboarding` instead of rendering a broken dashboard, so that new vendors always land on the correct first step.

5. **[AUTH-007 — `sendMessage` chat action verifies membership via RPC `is_org_member` without error handling]**
   WHEN `supabase.rpc("is_org_member", ...)` fails or returns null in `chat.ts`, THE Send Message Action SHALL treat the result as `false` (unauthorised) and return an error response, rather than throwing an unhandled exception.

6. **[AUTH-008 — Admin pages show quick-action links that bypass the moderation API]**
   WHEN an admin clicks "Approve" or "Reject" on the admin dashboard quick queues, THE Admin Page SHALL call the moderation API via a Server Action rather than navigating to a URL with a query parameter, so that approval cannot be faked by visiting a URL directly.

---

### Requirement 4 — API & Backend Correctness (Batch 3)

**User Story:** As a platform owner, I want all API routes to validate inputs completely, handle errors consistently, and protect against abuse, so that no endpoint can be exploited or cause data corruption.

#### Acceptance Criteria

1. **[API-001 — `checkoutSchema` does not validate `organizationId` ownership]**
   WHEN `POST /api/billing/checkout` is called, THE Checkout API SHALL verify membership before delegating to Stripe (see SEC-002); the Zod `checkoutSchema` MAY remain as-is since it only validates shape.

2. **[API-002 — `leadSchema` allows `startDate` to be in the past]**
   WHEN a lead is submitted with a `startDate` before today, THE Lead Schema SHALL reject it with a validation error, so that leads for past rental dates cannot be created.

3. **[API-003 — `/api/search/reindex` is a health-check only, not a real reindex]**
   THE Search Reindex API SHALL be documented as a health-check endpoint; a separate cron-triggered route or Supabase Edge Function SHALL process pending `search_index_jobs` records, so that the Typesense index stays in sync.

4. **[API-004 — `GET /api/reviews` uses `createAdminClient` (service role) for a public read]**
   WHEN `GET /api/reviews` is called without authentication, THE Reviews API SHALL use the server SSR Supabase client (publishable key + RLS) for the read query, so that the service-role key is not exercised for public, unauthenticated requests.

5. **[API-005 — No `Content-Type` enforcement on POST routes]**
   WHEN a POST request arrives at `/api/leads` or `/api/reviews` with an unexpected `Content-Type`, THE API SHALL reject the request with `415 Unsupported Media Type` if the body cannot be parsed as JSON, rather than throwing an unhandled exception.

6. **[API-006 — Geocode proxy proxies arbitrary `limit` parameter without capping]**
   WHEN `GET /api/geocode?limit=999` is called, THE Geocode API SHALL cap the `limit` parameter to a maximum of 10 before forwarding to the upstream Photon service, so that the proxy cannot be used to generate oversized upstream requests.

7. **[API-007 — `invoice.payment_succeeded` uses an unsafe cast to read `subscription` field]**
   WHEN the Stripe webhook processes `invoice.payment_succeeded`, THE Webhook Handler SHALL use the Stripe SDK's typed `invoice.parent?.subscription_details?.subscription` or an equivalent typed path instead of the `(invoice as unknown as Record<string, unknown>).subscription` cast, so that future Stripe API changes do not silently break subscription renewal tracking.

---

### Requirement 5 — Database & Data Integrity (Batch 3, continued)

**User Story:** As a platform owner, I want all database operations to be safe, consistent, and protected from race conditions, so that data is never partially written or silently corrupted.

#### Acceptance Criteria

1. **[DB-001 — `deleteVehicle` deletes images before the vehicle but does not use a transaction]**
   WHEN `deleteVehicle` is called and the storage deletion succeeds but the database `vehicle_images` delete fails, THE System SHALL have a compensating mechanism (or use a Postgres function) to ensure image records and files remain consistent, so that orphaned storage objects are not accumulated.

2. **[DB-002 — Lead expiration cron deletes rows without archiving]**
   WHEN the pg_cron job deletes leads older than 90 days, THE System SHALL soft-delete leads by setting a `deleted_at` timestamp (or archive to a separate table) before hard deletion, so that audit trails and lead analytics are preserved.

3. **[DB-003 — `getLeadStats` fetches all lead rows to count by status in application code]**
   THE Lead Stats Query SHALL use a Postgres `GROUP BY status` query (or `COUNT(*) FILTER (WHERE status = ...)`) instead of fetching all rows and filtering in JavaScript, so that the query scales beyond thousands of leads without O(n) memory use.

4. **[DB-004 — `fallbackDatabaseSearch` uses `ilike` with unescaped `%` characters in the query string]**
   WHEN the Typesense fallback database search is executed with a query containing `%` or `_` characters, THE Fallback Search SHALL escape those characters before constructing the `ilike` pattern, so that wildcard injection does not return incorrect results.

5. **[DB-005 — Vehicle `views_count` cache can drift if the `increment_vehicle_view` RPC fails silently]**
   WHEN the `increment_vehicle_view` RPC call fails on the vehicle detail page, THE Vehicle Detail Page SHALL log the error but SHALL NOT throw or crash the page render, as the current implementation already wraps the call in a try/catch — confirm the error path returns without breaking the response (already correct, document as verified).

---

### Requirement 6 — Frontend & UX (Batch 4)

**User Story:** As a customer or vendor, I want all UI states (loading, empty, error, success) to be handled correctly and accessibly, so that no interaction leaves me stuck or confused.

#### Acceptance Criteria

1. **[UX-001 — Vendor billing page has no `organizationId` input on checkout forms]**
   WHEN a vendor submits the checkout form on `/vendor/billing`, THE Billing Page SHALL include the vendor's `organizationId` as a hidden field in the form, so that the `checkoutSchema` Zod validation does not reject the request.

2. **[UX-002 — Delete vehicle uses a plain HTML form to a non-existent route]**
   WHEN a vendor clicks "Delete" on a vehicle row, THE Vehicles Page SHALL invoke the `deleteVehicle` Server Action instead of posting to `/api/vehicles/delete`, so that deletion is authorised and does not silently 404.

3. **[UX-003 — Onboarding page has no client-side error display for Server Action throws]**
   WHEN `submitVendorOnboarding` throws (e.g. duplicate ABN, DB error), THE Onboarding Page SHALL catch the error and display a user-friendly inline message rather than crashing with an unhandled error boundary.

4. **[UX-004 — Search page `sortBy: "rating"` maps to `price_per_day_aud:asc` silently]**
   WHEN a user selects "Best Rated" in the search sort dropdown, THE Search Page SHALL either display a "coming soon" label for that option or remove it from the sort list, so that users are not misled into thinking results are sorted by rating when they are not.

5. **[UX-005 — Vehicle detail page uses `any` casts for org and branch data]**
   WHEN the vehicle detail page renders organisation and branch data, THE Page SHALL use typed interfaces rather than `as any` casts so that TypeScript catches breaking schema changes at build time.

6. **[UX-006 — Messages page uses `as any` for vehicle and org joins]**
   THE Messages Page SHALL use typed interfaces for the joined `vehicles` and `organizations` fields rather than `as any`.

7. **[UX-007 — Leads page `<select onChange>` uses `window.location.href` for organisation switching]**
   WHEN a vendor with multiple organisations uses the org-switcher `<select>` on the leads page, THE Leads Page SHALL use a `<Link>`-based navigation or a `useRouter().push()` call instead of direct `window.location.href` assignment, so that the navigation is handled by the Next.js router and does not bypass transition state.

8. **[UX-008 — Homepage popular-location vehicle counts and starting prices are hardcoded]**
   THE Homepage SHALL fetch real vehicle counts and minimum prices per city from the database (or a cached query), so that the displayed numbers reflect the actual live marketplace state.

9. **[UX-009 — Homepage testimonials are hardcoded mock data]**
   THE Homepage SHALL display real approved reviews from the database (with a static fallback if none exist), so that social proof reflects genuine customer feedback.

10. **[UX-010 — Missing `generateStaticParams` / `notFound` for legal and location slug pages]**
    WHEN a browser requests `/legal/unknown-slug` or `/locations/unknown-city`, THE System SHALL return a proper 404 using `notFound()` rather than rendering a blank or broken page.

---

### Requirement 7 — Testing & Reliability (Batch 5)

**User Story:** As a platform owner, I want critical flows to be covered by automated tests, so that regressions are caught before deployment.

#### Acceptance Criteria

1. **[TEST-001 — No tests for ABN checksum validation]**
   THE Test Suite SHALL include unit tests for `isValidABN` covering: a known-valid ABN, a known-invalid ABN with correct digit count, an ABN with wrong digit count, and an ABN with non-numeric characters, so that the checksum algorithm is verifiably correct.

2. **[TEST-002 — No tests for rate-limit sliding window logic]**
   THE Test Suite SHALL include unit tests for `fallbackSlidingWindow` in `rate-limit-redis.ts` verifying: requests within limit are allowed, requests exceeding limit are blocked, and window expiry resets the counter, so that the in-memory fallback is trustworthy.

3. **[TEST-003 — No tests for Stripe webhook event processing]**
   THE Test Suite SHALL include integration-style tests (with a mock Supabase client) for `processStripeEvent` covering: `checkout.session.completed` creates/updates a subscription, `invoice.payment_failed` sets status to `past_due`, and `customer.subscription.deleted` sets status to `canceled`.

4. **[TEST-004 — No tests for `enforceVehicleLimit`]**
   THE Test Suite SHALL include unit tests for `enforceVehicleLimit` verifying: a vendor at their plan limit receives an error, a vendor below their limit can add more, and a vendor with no active subscription cannot add vehicles (or is granted a grace state depending on product decision).

5. **[TEST-005 — No tests for lead schema date validation]**
   THE Test Suite SHALL include unit tests for `leadSchema` verifying that a `startDate` in the past is rejected and a `startDate` today or in the future is accepted (once Requirement 4 AC-2 is implemented).

6. **[TEST-006 — Only 2 tests exist for the entire codebase]**
   FOR ALL critical API routes (`/api/leads`, `/api/billing/checkout`, `/api/admin/moderation`, `/api/stripe/webhook`), THE Test Suite SHALL include at least one happy-path test and one error-path test per route, so that broken route handlers are caught before deployment.

---

### Requirement 8 — Performance (Batch 6)

**User Story:** As a customer, I want search and detail pages to load quickly and efficiently, so that browsing the marketplace feels fast on any device.

#### Acceptance Criteria

1. **[PERF-001 — `getDashboardMetrics` executes 7+ sequential or weakly-parallel queries]**
   THE Get Dashboard Metrics Function SHALL execute all independent database queries in a single `Promise.all()` call, so that total latency equals the slowest single query rather than the sum of all queries.

2. **[PERF-002 — `getOrganizationLeads` fetches `lead_events` and `profiles` as a nested join on every row]**
   WHEN fetching leads for the vendor leads page, THE Get Organisation Leads Function SHALL use a paginated query and avoid deeply nested joins on `profiles` unless the data is displayed on that page, so that response time does not grow linearly with the number of events per lead.

3. **[PERF-003 — Vehicle detail page calls `createAdminClient()` (service role) for a public page]**
   WHEN rendering `/cars/[slug]`, THE Vehicle Detail Page SHALL use the SSR Supabase client (publishable key + RLS) for the public vehicle query and only use the admin client for the view-count RPC, so that service-role usage is minimised on high-traffic public pages.

4. **[PERF-004 — Homepage fetches `searchVehicles` on every request without caching]**
   THE Homepage SHALL wrap the featured-vehicles `searchVehicles` call with Next.js `unstable_cache` (or `revalidate`) with a 5-minute TTL, so that the home page does not hit the database or Typesense on every visitor request.

5. **[PERF-005 — `getAdminDashboardMetrics` fetches `plans` subscriptions in a second sequential query]**
   THE Admin Dashboard Metrics Function SHALL combine the subscription plan lookup into the initial `Promise.all()` set rather than making a second sequential query after the parallel set resolves.

6. **[PERF-006 — `getOpenFraudFlags` enriches every fraud flag with an individual Supabase query]**
   WHEN fetching open fraud flags for the admin dashboard, THE Get Open Fraud Flags Function SHALL use a JOIN in the initial query (or a single batch query) rather than one database call per flag in a `Promise.all()` loop, so that N+1 query patterns are eliminated.

7. **[PERF-007 — Images on `/cars/[slug]` use the public storage bucket URL directly without size parameters]**
   WHEN rendering vehicle images, THE Vehicle Detail Page SHALL use Next.js `<Image>` component with explicit `width`/`height` props and add the Supabase storage hostname to `next.config.ts` `remotePatterns`, so that images are optimised via the Next.js image pipeline.

---

### Requirement 9 — Deployment & Environment (Batch 6, continued)

**User Story:** As a platform operator, I want the deployment configuration to be complete and correct, so that the application starts cleanly in production without missing environment variables or misconfigured headers.

#### Acceptance Criteria

1. **[ENV-001 — `EMAIL_FROM` is not validated at startup]**
   WHEN the application starts, THE Config Module SHALL warn (or throw in production) if `EMAIL_FROM` is not set, so that lead alert emails are not sent from the fallback `leads@example.com` address.

2. **[ENV-002 — `NEXT_PUBLIC_APP_URL` is not validated at startup]**
   WHEN `getAppUrl()` is called in the billing checkout or portal handler, THE Config Module SHALL ensure `NEXT_PUBLIC_APP_URL` is set in production (not just defaulting to `localhost:3000`), so that Stripe success/cancel redirect URLs are never localhost in production.

3. **[ENV-003 — `next.config.ts` does not include the Supabase storage hostname in `remotePatterns`]**
   WHEN vehicle images stored in Supabase Storage are rendered with `next/image`, THE Next Config SHALL include `*.supabase.co` in `images.remotePatterns`, so that the image optimiser does not block Supabase-hosted images.

4. **[ENV-004 — No health check endpoint]**
   THE System SHALL expose a `GET /api/health` endpoint that returns `{ status: "ok", timestamp: <ISO> }` with a 200 status, so that load balancers and uptime monitors have a standard endpoint to probe.

5. **[ENV-005 — CSP `connect-src` does not include the Resend API domain used server-side]**
   THE Content Security Policy in `next.config.ts` includes `https://api.resend.com` in `connect-src`; since Resend is called server-side only, this directive is unnecessary and MAY be removed to tighten the policy, so that the browser cannot be directed to make requests to the Resend API.

---

### Requirement 10 — Product Logic & Business Loopholes (Batch 6, continued)

**User Story:** As a platform owner, I want all subscription enforcement, plan limits, and billing flows to be airtight, so that vendors cannot access paid features for free or bypass billing controls.

#### Acceptance Criteria

1. **[BIZ-001 — Billing page forms have no `organizationId` hidden field]**
   WHEN a vendor submits the "Start starter/growth/pro" form on `/vendor/billing`, THE Form SHALL include a hidden `organizationId` field populated with the vendor's organisation ID, so that the `checkoutSchema` Zod validation passes and the correct organisation is linked to the Stripe session.

2. **[BIZ-002 — A vendor without an active subscription can still create branches and vehicles (pending state)]**
   THE System SHALL allow vendors to create branches and vehicles in `pending` status without an active subscription, but WHEN a vendor's subscription status is `canceled` or `past_due` for more than 7 days, THE System SHALL prevent new vehicle and branch creation and display a prompt to reactivate, so that the grace period is explicit and enforced.

3. **[BIZ-003 — `enforceVehicleLimit` is not called from `updateVehicle`]**
   THE Update Vehicle Action need not re-enforce the vehicle limit (updating an existing vehicle does not increase count), so that vendors can edit vehicles they already own — this is correct and SHALL be documented as intentional.

4. **[BIZ-004 — Subscription `current_period_end` set to `now() + 30 days` on checkout.session.completed is approximate]**
   WHEN `checkout.session.completed` is processed, THE Webhook Handler SHALL retrieve the actual `current_period_end` from the Stripe Subscription object rather than using an approximate `+30 days` estimate, so that subscription expiry dates are accurate.

5. **[BIZ-005 — No vendor-facing subscription status indicator on the billing page]**
   THE Vendor Billing Page SHALL display the current subscription status (plan name, status, renewal date, vehicle usage), so that vendors know whether their subscription is active before submitting a new checkout form.

6. **[BIZ-006 — Lead expiration cron deletes PII without a data-export mechanism]**
   BEFORE the pg_cron job hard-deletes leads, THE System SHALL provide a data-export capability (CSV download from the vendor leads page), so that vendors can retain their lead history before the 90-day deletion window closes.

7. **[BIZ-007 — Review duplicate check uses `customerName` string matching, not user identity]**
   WHEN a duplicate review check is performed in `/api/reviews/route.ts`, THE Duplicate Check SHALL also compare by `ip_hash` (in addition to `customer_name` and `organization_id`), so that the same person cannot bypass the check by changing their display name.

8. **[BIZ-008 — `submitReview` Server Action in `actions/reviews.ts` does not check for existing review on the same lead]**
   WHEN a customer submits a review via the chat/messages flow, THE Submit Review Action SHALL check whether the customer has already submitted a review for the same `organization_id` within the past 30 days, so that duplicate reviews via the authenticated flow are prevented.

---

## Appendix A — Full Audit Findings Table

| ID | Domain | Severity | Type | File(s) | Summary |
|----|--------|----------|------|---------|---------|
| AUTH-001 | Auth | **Critical** | Real Bug | `middleware.ts` | Middleware refreshes session but never redirects unauthenticated users away from protected routes |
| AUTH-002 | Auth | **Critical** | Security Risk | `src/app/auth/callback/route.ts:16` | `next` param accepts external URLs → open redirect |
| AUTH-003 | Auth | High | Real Bug | All vendor Server Actions | `requireUser()` called but no check that the user owns the `organizationId` before `createAdminClient` — partially mitigated by `ensureUserCanManageOrganization` in most but not all paths |
| AUTH-004 | Auth | Medium | Latent Risk | `src/lib/security/auth.ts:39-44` | `userHasMfa` reads stale `app_metadata.aal`; `requireAdmin` now uses live MFA check but helper is still wrong |
| AUTH-005 | Auth | High | Real Bug | `src/app/auth/callback/route.ts` | OAuth code exchange errors are silently swallowed |
| AUTH-006 | Auth | Medium | UX Bug | `src/app/vendor/layout.tsx` | No redirect to onboarding when org is missing |
| AUTH-007 | Auth | Medium | Latent Risk | `src/app/actions/chat.ts:28` | RPC error not handled → potential null-deref |
| AUTH-008 | Auth | High | Security Risk | `src/app/admin/page.tsx` | Approve/reject are GET link navigations with no CSRF protection |
| SEC-001 | Security | **Critical** | Security Risk | `src/app/admin/page.tsx` | CSRF-able moderation actions via `<Link href="...?approve=...">` |
| SEC-002 | Security | **Critical** | Security Risk | `src/app/api/billing/checkout/route.ts` | No ownership check on `organizationId` → vendor can subscribe for another org |
| SEC-003 | Security | **Critical** | Security Risk | `src/app/api/billing/portal/route.ts` | No ownership check on `stripeCustomerId` → any vendor can access any billing portal |
| SEC-004 | Security | **Critical** | Missing Feature | `src/app/api/leads/quick/route.ts` | No rate limit on authenticated quick-lead endpoint |
| SEC-005 | Security | High | Real Bug | `src/app/api/contact-events/route.ts` | No vehicle↔vendor relationship check → fake click stats |
| SEC-006 | Security | **Critical** | Real Bug | `src/app/vendor/vehicles/page.tsx:162` | Delete form posts to non-existent `/api/vehicles/delete` route → 404 |
| SEC-007 | Security | High | Privacy Risk | `src/app/api/leads/route.ts:42` | Raw email logged in `console.info` |
| SEC-008 | Security | High | Real Bug | `src/app/auth/sign-in/page.tsx` | Dev password buttons render in production when `NODE_ENV` check is only on compile-time |
| API-001 | API | Medium | Missing Feature | `src/app/api/billing/checkout/route.ts` | `checkoutSchema` doesn't enforce org membership |
| API-002 | API | Medium | Real Bug | `src/lib/validation/schemas.ts` | `leadSchema` allows past `startDate` |
| API-003 | API | Low | Missing Feature | `src/app/api/search/reindex/route.ts` | Reindex route is health-check only, not real reindex |
| API-004 | API | Medium | Security Risk | `src/app/api/reviews/route.ts` | Public GET uses service-role Supabase client |
| API-005 | API | Low | Robustness | Multiple API routes | No `Content-Type` enforcement |
| API-006 | API | Medium | Security Risk | `src/app/api/geocode/route.ts` | `limit` param not capped → amplification potential |
| API-007 | API | High | Latent Risk | `src/app/api/stripe/webhook/route.ts:116` | Unsafe cast to read `subscription` from invoice object |
| DB-001 | Database | High | Data Integrity | `src/app/vendor/vehicles/actions.ts` | Image + vehicle delete without transaction |
| DB-002 | Database | Medium | Data Loss | `supabase/migrations/20260601100000_add_lead_expiration.sql` | Cron hard-deletes lead PII without archiving |
| DB-003 | Database | Medium | Performance | `src/lib/data/vendor.ts:getLeadStats` | Fetches all rows to count in JS |
| DB-004 | Database | Medium | Real Bug | `src/lib/search/typesense.ts:fallbackDatabaseSearch` | Unescaped `%`/`_` in `ilike` |
| DB-005 | Database | Low | Verified OK | `src/app/(public)/cars/[slug]/page.tsx` | View RPC error already handled |
| UX-001 | Frontend | **Critical** | Real Bug | `src/app/vendor/billing/page.tsx` | Checkout form missing `organizationId` hidden field → Zod validation always fails |
| UX-002 | Frontend | **Critical** | Real Bug | `src/app/vendor/vehicles/page.tsx:162` | Delete form posts to non-existent route |
| UX-003 | Frontend | High | UX Bug | `src/app/vendor/onboarding/page.tsx` | No error display for Server Action failures |
| UX-004 | Frontend | Medium | UX Bug | `src/app/(public)/search/page.tsx` | "Best Rated" sort silently maps to price-asc |
| UX-005 | Frontend | Low | Code Quality | `src/app/(public)/cars/[slug]/page.tsx` | `as any` casts for org/branch data |
| UX-006 | Frontend | Low | Code Quality | `src/app/messages/page.tsx` | `as any` casts for joins |
| UX-007 | Frontend | Medium | UX Bug | `src/app/vendor/leads/page.tsx` | `window.location.href` for org switching |
| UX-008 | Frontend | Medium | Fake Data | `src/app/page.tsx` | Hardcoded location vehicle counts and prices |
| UX-009 | Frontend | Medium | Fake Data | `src/app/page.tsx` | Hardcoded testimonials |
| UX-010 | Frontend | Medium | Real Bug | `src/app/(public)/legal/[slug]/page.tsx`, `locations/[city]/page.tsx` | Missing `notFound()` for unknown slugs |
| TEST-001 | Testing | Medium | Missing Test | `src/lib/validation/schemas.ts` | No ABN checksum tests |
| TEST-002 | Testing | Medium | Missing Test | `src/lib/security/rate-limit-redis.ts` | No sliding-window unit tests |
| TEST-003 | Testing | High | Missing Test | `src/app/api/stripe/webhook/route.ts` | No webhook event processing tests |
| TEST-004 | Testing | High | Missing Test | `src/lib/data/vendor.ts` | No vehicle limit enforcement tests |
| TEST-005 | Testing | Medium | Missing Test | `src/lib/validation/schemas.ts` | No past-date rejection tests |
| TEST-006 | Testing | High | Missing Test | All API routes | Critical API routes have zero automated tests |
| PERF-001 | Performance | Medium | Performance | `src/lib/data/vendor.ts:getDashboardMetrics` | Not all queries in `Promise.all` |
| PERF-002 | Performance | Medium | Performance | `src/lib/data/vendor.ts:getOrganizationLeads` | Deep nested joins on every row |
| PERF-003 | Performance | Medium | Security/Perf | `src/app/(public)/cars/[slug]/page.tsx` | Service-role client used for public page query |
| PERF-004 | Performance | Medium | Performance | `src/app/page.tsx` | No caching on homepage featured vehicles |
| PERF-005 | Performance | Low | Performance | `src/lib/data/admin.ts:getAdminDashboardMetrics` | Sequential plan query after parallel set |
| PERF-006 | Performance | Medium | Performance | `src/lib/data/admin.ts:getOpenFraudFlags` | N+1 query per fraud flag |
| PERF-007 | Performance | Medium | UX/Perf | `src/app/(public)/cars/[slug]/page.tsx` | Vehicle images not using next/image or remote pattern for supabase |
| ENV-001 | Deployment | High | Missing Config | `src/lib/email/resend.ts` | `EMAIL_FROM` not validated at startup |
| ENV-002 | Deployment | High | Missing Config | `src/lib/config.ts` | `NEXT_PUBLIC_APP_URL` not validated |
| ENV-003 | Deployment | High | Missing Config | `next.config.ts` | Supabase storage missing from `remotePatterns` |
| ENV-004 | Deployment | Medium | Missing Feature | — | No `/api/health` endpoint |
| ENV-005 | Deployment | Low | Nice-to-have | `next.config.ts` | Resend domain in browser CSP `connect-src` is unnecessary |
| BIZ-001 | Business | **Critical** | Real Bug | `src/app/vendor/billing/page.tsx` | Checkout form missing `organizationId` → subscriptions always fail |
| BIZ-002 | Business | High | Missing Feature | Vendor actions | No grace period / enforcement for lapsed subscriptions |
| BIZ-003 | Business | Low | Verified OK | `src/app/vendor/vehicles/actions.ts` | Update does not re-check limit — correct |
| BIZ-004 | Business | Medium | Data Quality | `src/app/api/stripe/webhook/route.ts:88` | `current_period_end` approximated at +30 days |
| BIZ-005 | Business | High | Missing Feature | `src/app/vendor/billing/page.tsx` | No subscription status display for vendor |
| BIZ-006 | Business | Medium | Privacy/Legal | `supabase/migrations/…lead_expiration.sql` | No lead export before hard delete |
| BIZ-007 | Business | Medium | Loophole | `src/app/api/reviews/route.ts` | Review duplicate check bypassed by changing name |
| BIZ-008 | Business | Medium | Loophole | `src/app/actions/reviews.ts` | No duplicate review check in authenticated chat flow |

---

## Appendix B — Fix Batches

### Batch 1 — Critical Security & Build Blockers
Fixes: AUTH-001, AUTH-002, SEC-001, SEC-002, SEC-003, SEC-004, SEC-005, SEC-006, SEC-007, SEC-008, UX-001 (billing form bug), BIZ-001 (same as UX-001)

### Batch 2 — Auth & Access Control
Fixes: AUTH-003, AUTH-004, AUTH-005, AUTH-006, AUTH-007, AUTH-008

### Batch 3 — API & Backend Correctness
Fixes: API-002, API-004, API-005, API-006, API-007, DB-001, DB-002, DB-003, DB-004, BIZ-004, BIZ-007, BIZ-008

### Batch 4 — Frontend Bugs & UX Failures
Fixes: UX-002 (already fixed by SEC-006), UX-003, UX-004, UX-005, UX-006, UX-007, UX-008, UX-009, UX-010

### Batch 5 — Tests & Regression Protection
Fixes: TEST-001 through TEST-006

### Batch 6 — Performance, Deployment & Hardening
Fixes: PERF-001 through PERF-007, ENV-001 through ENV-005, BIZ-002, BIZ-005, BIZ-006

---

## Appendix C — Severity Counts by Domain

| Domain | Critical | High | Medium | Low | Nice-to-have |
|--------|----------|------|--------|-----|--------------|
| Auth | 2 | 3 | 3 | 0 | 0 |
| Security | 4 | 2 | 0 | 0 | 0 |
| API | 0 | 1 | 3 | 2 | 0 |
| Database | 0 | 1 | 3 | 1 | 0 |
| Frontend/UX | 2 | 1 | 4 | 3 | 0 |
| Testing | 0 | 2 | 3 | 0 | 0 |
| Performance | 0 | 0 | 5 | 2 | 0 |
| Deployment | 0 | 2 | 1 | 0 | 1 |
| Business | 1 | 2 | 3 | 1 | 0 |
| **Total** | **9** | **14** | **25** | **9** | **1** |
