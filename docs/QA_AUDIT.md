# QA Audit — Post-Removal Functional & UI Check

**Date:** 2026-07-16
**Branch:** `cleanup/legacy-marketplace-removal` (working tree, uncommitted)
**Method:** Production build + live dev server (port 60862) driven in-browser — every public route hit, key flows exercised, console/network watched. Admin assessed by code (login not possible for me — see caveat).
**Verdict:** The public buyer funnel is **healthy and working**. No 404s/500s anywhere. A handful of real bugs (all **pre-existing**, not caused by the removal work) and some SRS completeness gaps remain.

---

## 1. Verified working ✅

**Build & routing**
- `npm run build` → **exit 0**. Every route compiles and prerenders. No broken imports after the ~58-file removal.
- HTTP sweep of 30 routes (public pages + make/model/body/budget/legal): **all 200**, zero 404/500.
- All 35 header/footer internal links resolve to real routes.

**Homepage** — hero + search (make/model/price), trust bar (inspected / roadworthy / finance / trade-in), featured-vehicles rail, how-it-works, sell + finance CTAs. **Prices render directly** with price-drop chips (e.g. `$29,990` ~~$31,990~~). No console errors.

**Inventory listing (`/used-cars`)** — faceted filters with **live counts** (make, body, fuel, transmission, price/year/km ranges), 6 sort options, result count ("8 cars available"), status badges (New arrival / Reserved), price-drop badges.

**Vehicle Detail Page (my rewrite) — confirmed correct** ✅
- CTAs: **Call `03 9123 4567` · WhatsApp · Enquire** + Book inspection · Finance this car · Trade-in (4 `tel:` links, 3 `wa.me` links).
- **No "Unlock Contact", no "Login to view price", no "Make an Offer"** — all removed.
- Price shows directly; **Finance Calculator works** (deposit, term, `$108/wk`, 8.99%/60mo, full disclaimer); spec grid (8), grouped features (safety/comfort/tech/exterior), description, "Buy with confidence" trust block, sticky mobile CTA bar, similar cars.

**Budget landing pages (`/used-cars/under-30000` etc.)** — **work and filter correctly** (4 cars, all ≤ $30k, proper H1 + intro copy). *(Correction: my earlier audit listed these as missing — they exist.)*

**Contact form** — correct fields (name*, phone*, email, subject select, message*) + newsletter signup.

**Admin** — correctly **auth-protected**: `/admin` redirects to a staff sign-in page (email/password + Google). Staff auth survived the buyer-auth removal intact. Dashboard code is clean and token-based (lead + inventory KPI cards, SLA-breach highlighting, quick actions).

---

## 2. Bugs & errors found 🐞

### 🔴 P1 — React `set-state-in-effect` errors (6 files) — *pre-existing*
`react-hooks/set-state-in-effect` **errors** (fail CI) in:
`hero-search.tsx`, `motion-scroll.tsx`, `scroll-to-top.tsx`, `mobile-animation-provider.tsx`, `use-reduced-motion.ts`, `image-with-fallback.tsx`.
Calling `setState` synchronously in an effect triggers **cascading re-renders** — extra render passes on every affected component. Almost certainly why the browser's screenshot/accessibility snapshot repeatedly **timed out** (the renderer never settles). This is a genuine performance/stability issue, not just a lint nit. Worth fixing early.

### 🟠 P2 — Two failing tests — *pre-existing*
- `auth-profile-derivation.property.test.ts` — `avatar_url` not on `ProfileUpsert` type.
- `schemas.test.ts` → "rejects lead submissions without consent" — `leadSchema` doesn't enforce consent the test expects. Needs a product/legal call (consent required, or fix the test).
Both fail on the pre-change baseline too — **not** caused by the removal work. Suite otherwise: 156 pass.

### 🟠 P2 — Contact page has no embedded map (SRS FR-7)
Form + details render, but there's no map embed / directions block the SRS calls for.

### 🟡 P3 — "Zero-warning" CI policy is currently violated — *mostly pre-existing*
~30 ESLint warnings, e.g. unused nav imports in `app/page.tsx` (`NAV_BODY_TYPES`, `BODY_TYPE_LABELS`, `budgetHref`, `popularMakes`…), unused `Lock` in `staff-sign-in.tsx`, unused `cn` in `scroll-reveal.tsx`, unused `orgId` in `cron/reminders`. CI (`lint` job) fails on warnings, so this must be cleared before green CI.

### 🟡 P3 — `<img>` instead of `next/image` (LCP/perf)
Raw `<img>` in `site-header` (logo), `staff-sign-in`, `hero-animations` — flagged for LCP/bandwidth. Minor but affects the SRS performance budget.

---

## 3. Completeness gaps vs SRS (not bugs — for the build phase)

- **Admin dashboard is minimal** vs SRS §15.1: has lead/inventory KPIs + SLA breaches, but no stock-aging buckets, top-10 vehicles by views/enquiries, conversion rate, recent-activity feed, or date-range selector.
- **Admin sections still absent** (from the prior audit): Featured & Merchandising, SEO manager (redirects/landing copy), Analytics & Reports, Pages CMS.
- Cars24-inspired items not yet built: condition report + honest defect photos, testimonial source badges, in-grid promo interleaves, curated collection pages.

---

## 4. Could NOT verify — needs you 🔒

1. **Admin dashboards, live** (inventory add/edit + image upload, leads list/pipeline, testimonials/FAQs/settings/roles CRUD, "does it look stunning"). I **cannot log in** — entering passwords and creating accounts are actions I'm not permitted to perform. To assess these I need one of: you logged in on a shared screen, a session/preview you drive, or you doing the visual pass while I review the code. Code-level: the admin pages share one clean, consistent, token-based design system, but visual polish and interactive correctness are unverified.
2. **Lead form end-to-end submission.** Forms render with correct fields and post to `/api/v1/leads` (route exists), but I didn't submit — Cloudflare Turnstile anti-spam would gate an automated submit, and creating live test leads wasn't warranted for a report-first pass. Recommend a manual submit test per lead type with Turnstile keys configured.

---

## 5. Recommended fix order (nothing changed yet)

1. 🔴 Fix the 6 `set-state-in-effect` errors (unblocks green CI + kills cascading renders + likely restores screenshot/snapshot tooling).
2. 🟡 Clear the ESLint warnings (unused imports etc.) → CI green.
3. 🟠 Resolve the 2 failing tests (decide on the consent rule).
4. 🟠 Add the contact-page map.
5. Then move to the build-phase gaps (admin analytics/sections, condition photos, etc.).

Dev server left running on **http://localhost:60862** for follow-up checks.
