# Platform Audit — Cars365 Used-Car Lead-Gen Site

**Date:** 2026-07-16
**Auditor role:** Full-stack platform engineer
**Scope:** Whole codebase — public site, admin panel, API, data layer, schema, repo hygiene
**Baselines used:** `Used-Car-Marketplace-SRS-BRD.docx` (26-section SRS/BRD) and the phased transformation plan (`hey-so-have-streamed-ladybug.md`).

---

## 0. TL;DR — the one thing to understand

This platform is **half-pivoted**. It started life as a multi-tenant car-**rental** marketplace SaaS and is being turned into a **single-company used-car sales lead-generation website**. The *new* skeleton is in place (public `(public)` + `admin` boundaries, inventory, leads, testimonials, FAQs), but **large chunks of the old marketplace are still wired into live, buyer-facing surfaces** — not just sitting as dead files.

The most important finding: **the money page (the Vehicle Detail Page) is actively broken against the spec.** Instead of one-tap Call / WhatsApp / Enquire, it forces buyers to *log in to "Unlock Contact Details"* and offers a *"Make an Offer" bidding form*. The SRS is emphatic that **no page requires login** and there is **no auction/bidding** — this directly suppresses the single metric the whole product exists for: leads.

So the audit splits into two lists:
- **REMOVE** — dead code + live-but-out-of-scope features + repo cruft.
- **BUILD** — capabilities the SRS marks *Must-have (V1)* that don't exist yet.

Severity legend: 🔴 blocks the core product / actively harms conversion · 🟠 significant debt or missing must-have · 🟡 cleanup / hygiene.

---

# PART A — REMOVE (cruft, dead code, out-of-scope features)

## A1. Confirmed dead code — 0 references, safe to delete 🟡

Verified unreferenced anywhere in `src/` (grep for imports returns nothing but the file itself). These are pure leftovers from the rental/marketplace era.

| File | What it is | Why it's dead |
|------|-----------|---------------|
| `src/components/admin/admin-sidebar.tsx` | Old admin nav linking to `/admin/vendors`, `/admin/listings`, `/admin/fraud`, `/admin/reviews`, `/admin/billing` | **None of those routes exist.** The live admin layout uses `admin-nav.tsx`. This is a broken, orphaned nav. |
| `src/components/dashboard-shell.tsx` | Vendor/buyer/seller dashboard chrome (20 vendor references) | Not imported; belongs to the deleted vendor/customer boundaries. |
| `src/components/chat-interface.tsx` | Buyer↔seller live chat UI | No buyer accounts, no chat in scope. |
| `src/components/chat-sidebar.tsx` | Chat thread list | Same. |
| `src/app/actions/chat.ts` | Chat server actions | Only referenced by the dead `chat-interface.tsx`. |
| `src/app/actions/reviews.ts` | Customer-submitted review actions (11 review refs) | SRS replaces customer reviews with **admin-entered testimonials**. |
| `src/lib/support-channels.ts` | Rental support-router config | Not imported. |

**Dead subtree (chat):** `chat-interface.tsx` → `chat-sidebar.tsx` → `actions/chat.ts` form a closed dead loop. Delete together.

## A2. Live but OUT OF SCOPE — features actively wired into buyer-facing pages 🔴

These are the dangerous ones. They *run in production* and contradict the confirmed scope ("no buyer login/accounts", "no C2C/auction", "frictionless lead capture").

### A2.1 🔴 The whole buyer login / account system
- `src/app/(public)/account/*` — buyer dashboard: `page.tsx`, `saved/`, `offers/`, `messages/`, `messages/[id]/` + `layout.tsx`.
- `src/components/account/*` — `buyer-overview.tsx`, `seller-overview.tsx`, `account-nav.tsx`.
- `src/app/auth/*` — `sign-in`, `mfa`, `callback`, `sign-out` for **buyers** (staff sign-in is separate and stays).
- `src/components/auth/*` — `auth-provider.tsx`, `auth-modal.tsx`, `auth-menu.tsx`, `gated-price.tsx`.
- **Wiring proof:** `AuthProvider` is mounted in `src/app/layout.tsx:138`; `AuthMenu` renders in `src/components/site-header.tsx:110`. So a "Sign in" affordance is in the public chrome on every page.
- `middleware.ts:48-51` still protects `/account` as an authenticated route.

**Spec says:** "No buyer login/accounts (favorites via localStorage)." → Rip out the entire buyer-auth + account subsystem. Keep only staff auth for `/admin`.

### A2.2 🔴 VDP "Unlock Contact Details" gating — `src/components/leads/vdp-lead-actions.tsx`
The primary CTA on the money page currently **hides the phone number and WhatsApp link** behind a login wall:
```
Lock icon → "Unlock Contact Details" → openAuthModal() if not logged in
→ POST /api/leads/quick { vehicleId, vendorId: "unknown-vendor" }
```
This is the opposite of the SRS CTA architecture (Call | WhatsApp | Enquire, always visible, no login). It also posts a hardcoded `"unknown-vendor"` — a fossil of multi-tenancy. **This single component is the biggest conversion leak in the app.**

### A2.3 🔴 Bidding / "Make an Offer" auction feature
- `src/components/leads/bidding-form.tsx` (rendered from the live VDP via `vdp-lead-actions.tsx:114`).
- `src/app/api/v1/bids/route.ts`.
- `account/offers/page.tsx` (buyer's bid history).
- Backing schema: migration `0012_bidding_and_messaging.sql`.

**Spec says:** no auction/bidding, no C2C. Remove the feature end-to-end (UI → API → tables).

### A2.4 🔴 Buyer↔seller messaging
- `src/app/api/v1/messages/route.ts`, `account/messages/*`, plus the dead chat components in A1.
- Backing schema: same `0012_bidding_and_messaging.sql`.

**Spec says:** contact happens via WhatsApp/phone/forms; there is no on-site messaging. Remove.

### A2.5 🔴 "Pro plan" gating on the public vehicles API — `src/app/api/v1/vehicles/route.ts`
```ts
import { organizationHasFeature } from "@/lib/plan-features";
...
return { error: NextResponse.json({ error: "API access requires Pro plan" }, { status: 403 }) };
```
`src/app/api/v1/vehicles/[id]/route.ts` imports the same. This is SaaS subscription logic on a site with **one owner and no subscriptions**. It can outright 403 legitimate inventory requests. Remove the gating and delete `src/lib/plan-features.ts`.

### A2.6 🟠 `src/app/api/leads/quick/route.ts`
The "quick lead" endpoint the unlock-flow calls, built around the stale `vendorId` concept. Fold real quick-enquiry into the single `POST /api/v1/leads` route and delete this.

## A3. Stale backend / schema / server logic 🟠

| Item | Location | Problem |
|------|----------|---------|
| Bidding + messaging tables | `supabase/migrations/0012_bidding_and_messaging.sql` | Schema for removed features. |
| Blog tables | `supabase/migrations/0011_blog_articles.sql` + blog columns in `0006_content.sql`, seed in `0010_seed.sql` | Blog was removed per your instruction; DB objects remain. |
| Vendor/branch/review/fraud moderation | `src/app/admin/actions.ts` (`moderateVendor`, `moderateBranch`, `moderateReview`, `updateFraudFlagStatus`) + `src/app/api/admin/moderation/route.ts` + `src/lib/moderation.ts` | These moderate **vendors, branches, customer reviews, fraud flags** — none of which exist in the target model. Per the plan there is **no cross-party moderation queue** (staff publish directly). Keep only the *vehicle* status path; strip the rest. |
| Subscription plan features | `src/lib/plan-features.ts` | Entire file is subscription-tier logic. Delete (see A2.5). |
| `organization_id` / vendor / branch / rental / booking language | 286 occurrences across 65 files (types, validation schemas, SEO discovery, data/admin, tests) | Systemic naming debt from the rental era. Sweep during each subsystem's rewrite; don't bulk-rename blindly (some are in SEO/schema strings). |

> **Note on migrations:** the plan's stated approach is a **brand-new Supabase project with a fresh migration sequence** — the old rental-schema migrations are *retired wholesale*, not patched. If that reset hasn't happened yet, it's the highest-leverage backend task and makes most of A3's schema items moot in one move.

## A4. Duplicate / redundant pages 🟡

| Duplicate | Keep | Reason |
|-----------|------|--------|
| `src/app/(public)/faq/` **and** `src/app/(public)/faqs/` | `/faqs` | SRS sitemap specifies `/faqs/`. Delete `/faq`, add a 301. |
| `src/app/(public)/testimonials/` **and** `src/app/(public)/success-stories/` | Both allowed | `/testimonials` is the SRS page; `/success-stories` is a "kept static page" per plan decision #7. Make sure they don't present the same content twice — differentiate or merge. |

## A5. Repo & docs hygiene 🟡

| Item | Action |
|------|--------|
| `old_globals.css` (repo root) | Delete — superseded by `src/app/globals.css`. |
| `docs/historical/` (19 SEO/audit artifacts, many rental- and AI-era) | Archive out of the repo or delete. |
| `.kiro/specs/` (blog-content-hub, whatsapp-auto-responder, plan-support-tiers, multi-method-auth, restrict-locations, …) | Most describe removed features. Prune to only specs matching the new product. |
| Doc drift | `README.md` / `docs/ARCHITECTURE.md` still say email uses **Resend** (actual: AWS SES via nodemailer). `docs/` broadly still describe vendors/branches/Stripe/billing. Rewrite or delete `docs/{API,DATABASE,SECURITY,SEO,ARCHITECTURE}.md`. |
| `CLAUDE.md` | Still carries the full rental-architecture description under an "ACTIVE PIVOT" banner. Rewrite once the pivot lands. |
| `package.json` → `shadcn` in **dependencies** | `shadcn` is a CLI generator, not a runtime dependency. Move to devDependencies or drop. |

## A6. Stale / orphaned tests 🟡

| Test | Problem |
|------|---------|
| `src/__tests__/properties/vendor-vehicle-cap.test.ts` | Tests per-vendor plan-based vehicle caps — a removed concept. |
| `src/lib/moderation.test.ts` | Covers vendor/branch/review/fraud moderation being stripped in A3. |
| `resend.test.ts` (per CLAUDE.md note) | Tests a provider (Resend) that no longer exists in code. |
| `src/__tests__/properties/whatsapp-reposition.property.test.ts`, `arbitraries.ts` | Contain vendor/booking arbitraries — re-scope. |

## A7. Payments / Stripe — confirmed not needed, two residuals remain 🟡

You're right: **there is no pricing, no checkout, and no online payment** in this product (the SRS lists "no online payments and no checkout" as a defining constraint). The Stripe SDK and dependency are **already gone** — `package.json` and the lockfile contain zero Stripe references. Only two dead fossils remain:

| Residual | Location | Action |
|----------|----------|--------|
| `checkoutSchema` (Zod) | `src/lib/validation/schemas.ts:148` | Dead schema for a checkout that doesn't exist — delete. |
| `stripe_webhook_events` probe | `src/app/api/health/route.ts:35,44` | Health check pings a Stripe webhook table that won't exist in the new schema — remove the probe. |

**Bottom line:** no Stripe/PSP integration is required or planned. The only "money" surfaces are the *finance enquiry* (a referral lead to a broker — no lending on-site) and the *weekly-payment estimate* (a display calculator). Neither touches a payment processor.

---

# PART B — BUILD (required by the product, not yet present)

Grounded in SRS functional requirements (FR-x) and admin spec (§15). Priority tags are the SRS's own: **M** = Must (V1), **S** = Should, **C** = Could.

## B1. 🔴 Fix the Vehicle Detail Page CTAs (FR-4, FR-8/9/10) — **M**
Replace the "Unlock Contact" + bidding flow with the SRS CTA architecture:
- Always-visible **Call | WhatsApp | Enquire** row (no login, no gating).
- **Sticky mobile CTA bar** (Call/WhatsApp/Enquire) appearing after the hero CTA scrolls out (`< 1024px`).
- Desktop: sticky enquiry card in the right column.
- WhatsApp prefilled with vehicle title + stock ID + URL (the `wa.me` builder in `src/lib/whatsapp.ts` already exists — wire it here).

This is the highest-ROI change in the whole backlog.

## B2. 🟠 Missing public pages / SEO landing pages (FR-26, FR-2) — **M**
- **Budget landing pages** `/used-cars/under-{price}/` — in the SRS sitemap and programmatic-SEO set; not present. (Make/model/body-type pages exist ✓.)
- **Proper legal pages** `/privacy-policy/` and `/terms/` — SRS lists them explicitly; currently only a generic `legal/[slug]` + `legal/rules`. Confirm both resolve with real, counsel-ready copy.
- Each landing page needs: H1 with live count, unique intro copy, internal-link modules, FAQ block, `ItemList` schema, breadcrumbs.
- *(Blog `/blog/*` is intentionally omitted per your removal instruction — noting so it isn't mistaken for a gap.)*

## B3. 🟠 Finance repayment calculator widget (FR-13) — **M**
Interactive VDP widget: adjustable deposit/term, live-updating weekly estimate, admin-configurable rate/term/deposit in `settings.finance_params`, mandatory "indicative only" disclaimer. A static line isn't sufficient per plan decision #6.

## B4. 🟠 Admin panel — missing sections (SRS §15) — **M/S**
Current admin nav: Dashboard, Inventory, Leads, Testimonials, FAQs, Settings, Users&Roles, Audit. Missing vs §15:

| Section | SRS ref | Priority | Notes |
|---------|---------|----------|-------|
| **Featured & Merchandising** | §15.5 | M | Featured-car selector (max 12, drag-order), homepage rail config, promo-banner slots. `featured.ts` data exists but no admin UI. |
| **SEO Management** | §15.6 | M | Per-entity title/desc/OG overrides, landing-page copy editor, **redirect manager (301 table + CSV import)**, sitemap status, schema toggles. |
| **Analytics & Reports** | §15.8 | S | Per-vehicle funnel, lead-source, SLA/response-time, stock-aging, monthly export. `vehicle_daily_stats` is meant to power this. |
| **Pages CMS** | §15.4 | S | Thin CRUD for legal/about copy blocks. |

## B5. 🟠 Lead pipeline completeness (FR-20, §14.4, §15.3) — **M**
The leads section exists but the SRS pipeline is richer than what's wired:
- Full **8-state pipeline**: new → contacted → qualified → inspection_scheduled → negotiation → won / lost / spam, with **mandatory loss reason**.
- **Kanban board** view (drag-to-transition) in addition to the list.
- **SLA timer** on New leads + email escalation after 30 min in business hours (a core "speed-to-lead" product feature per §26).
- **Spam quarantine view** (auto-flagged leads never notified to sales).
- Assign, reminders, CSV export, duplicate-by-phone detection, repeat-interest flag.
- Server-side anti-spam module (`src/lib/leads/spam-check.ts` exists — verify it does honeypot + time-to-submit + disposable-email soft-flag + silent quarantine).

## B6. 🟠 SEO infrastructure (SRS §16) — **M**
- **JSON-LD coverage:** `Vehicle` + `Product/Offer` on VDP, `ItemList` on listings, `BreadcrumbList` site-wide, `FAQPage`, `AggregateRating/Review` on testimonials, `AutoDealer`(LocalBusiness) org-wide, (Article only if blog returns). Audit `src/lib/seo/schema.ts` for gaps.
- **Split sitemap** (pages / vehicles / blog) with accurate `lastmod`.
- **DB-driven redirects** table consulted in `middleware.ts` (cached) to drive sold/archived-VDP 301 hygiene.
- Verify `robots.txt` blocks `/admin`, `/api`, and faceted params.

## B7. 🟠 Vehicle lifecycle automation (§13.2) — **M**
Status machine `draft → available → reserved ⇄ available → sold → archived` with the display/redirect rules: sold cars delisted after 7 days, VDP kept live 60 days then 301 → model page, archived 301s immediately. Needs the scheduled jobs (`archive_sold_vehicles`, `expire_stale_vdps`) + status-aware VDP banners.

## B8. 🟡 NFR / security hardening (SRS §10, §20, §15.9) — **M**
- **MFA enforcement** for admin/manager roles (`admin_roles.mfa_required`).
- **Three rate-limit tiers**: leads 5/10min, search 60/min, admin-login 10/15min with a real 10-fail/15-min lockout counter.
- CSP final pass (strip any residual Stripe hosts; correct the stale Resend entry).
- WCAG 2.1 AA pass; performance budget (JS < 200 KB gz on public pages — audit framer-motion).

---

# PART B★ — Competitor-inspired feature gaps (Cars24)

Reviewed the live **cars24.com.au** homepage + listing page. Cars24 is a mature, at-scale used-car retailer — but it is a **full transactional retailer**: buy 100% online, home delivery, 30-Day Return Guarantee, pay upfront. **None of that transactional machinery belongs in this product** (it's the exact scope this platform deliberately excludes — and the reason no Stripe/PSP is needed). What's worth borrowing is their **merchandising, trust, and SEO conversion patterns**, adapted to a lead-gen model.

### ✅ Adopt — patterns that feed leads (not yet built, or under-built here)

| # | Cars24 pattern | What to build here | Priority |
|---|----------------|--------------------|----------|
| 1 | **Discount / "$1,200 off" + "Price drop" chips** on cards | Explicit was→now price + savings chip + auto "Price drop" badge (schema has `previous_price`/`price_changed_at`; needs the card UI). Strong, honest urgency device. | M — part of the vehicle-card rewrite |
| 2 | **Quality-tier badge** ("Cars24 Select" / "Cars24 Luxury") | An optional per-vehicle quality tier (e.g. "Premium Selection") as a merchandising + trust signal. Not in the current schema. | S / Could |
| 3 | **"The Cars24 Edge" trust grid** (inspection, RWC & PPSR, roadside, rego transfer) | A scannable icon grid of *your* proof points (multi-point inspection, roadworthy included, warranty, established years, Google rating) on home + VDP. Components exist (`trust-signals*`); needs the icon-grid treatment. | M (FR-1, §11.3) |
| 4 | **Condition report + "Imperfections & Safety" filter + honest defect photos** | First-class VDP "Condition & inspection" block, a defects photo set (SRS §13.3 mandates defect close-ups), and a condition/imperfections filter facet. Honesty-as-trust is the anti-marketplace edge. | M (FR-4, §13.3) |
| 5 | **In-grid promo interleaves** (finance pre-approval card, "Got a car to sell?" card between listings) | Insert 1–2 cross-sell cards into the inventory grid (finance + sell-your-car). Cheap, high-intent cross-sell. | S |
| 6 | **Listing-page editorial SEO** — H1 with live count, long intro copy, "Popular models" internal-link table, why-buy list | Confirms Part B2: each landing page needs live-count H1 + unique copy + internal-link modules + FAQ. Cars24 does this textbook-well. | M (FR-2/26) |
| 7 | **Curated collection landing pages** — "Family Friendly", "Utes", "Luxury", "Adventure", "Budget Friendly", "Less Driven" | Add curated collection pages beyond make/model/body/budget (e.g. "Family SUVs", "First cars", "Tradie utes"). Extra long-tail SEO + human browse entry points. | S |
| 8 | **"As featured in" press bar** + named customer stories with source badges ("via ProductReview", 5.0) + aggregate rating | Homepage press-logo strip; testimonials with **source attribution** (google/facebook/direct) + aggregate rating (SRS already models `testimonials.source`). Surface stories near conversion points, not just on `/testimonials`. | M (FR-16) |
| 9 | **Persistent "Call us 1800…" in the header** + weekly-payment framing on every card | Reinforces Part B1 (persistent call button) and the weekly-estimate teaser on cards. | M (FR-10, FR-3) |
| 10 | **City hubs**: `/used-cars-in-{city}` **and** `/sell-my-car-in-{city}` footer link lattice | Confirms the multi-city decision — ensure both *buy-in-city* and *sell-in-city* pages exist and are cross-linked in the footer. | M (§16.6) |
| 11 | **Free instant valuation** for sell/trade-in ("Get a free valuation instantly") | The current sell/trade-in flow is a lead form (correct for V1). A rules-based instant range is an SRS **V2 (Could)** item — note as a future upsell, not V1. | Could / V2 |

### 🚫 Do NOT copy — Cars24's transactional layer (out of scope by design)

Buy-online checkout · pay-upfront · **home delivery / doorstep logistics** · 30-Day Return Guarantee (returns processing) · on-site finance *lending/origination* (we only *refer* to broker partners) · native app download push. Copying any of these would (a) require a payment processor you explicitly don't want, and (b) dilute the single job of the site: **capture the lead, close it offline with a human.** This is the "be the anti-marketplace" positioning the SRS closes on — *"every car is ours — inspected by us, backed by a human who answers in 15 minutes."*

---

# PART C — Recommended order of operations

A pragmatic sequence that de-risks the conversion path first, then removes weight, then fills gaps:

1. **🔴 Fix the VDP CTAs (B1) + remove the unlock/bidding/messaging features (A2.2–A2.4).** One coherent change; restores the core lead flow. *Highest ROI.*
2. **🔴 Remove buyer auth + account subsystem (A2.1)** and the Pro-plan API gating (A2.5) + `api/leads/quick` (A2.6). Simplifies middleware, header, layout.
3. **🟡 Delete confirmed dead code (A1) + repo cruft (A5) + duplicate pages (A4).** Fast, low-risk, shrinks the surface before deeper work.
4. **🟠 Strip stale server/schema logic (A3)** — or, if not yet done, execute the **fresh-Supabase-project reset** the plan calls for, which subsumes most of A3.
5. **🟠 Build the missing must-haves (B2, B3, B5, B7)** — budget landing pages, finance calculator, full lead pipeline, lifecycle automation.
6. **🟠 Complete admin (B4) and SEO infra (B6).**
7. **🟡 Hardening + tests (B8, A6).**

After each step: `npm run lint`, `npx tsc --noEmit`, `npm run test` (ESLint warnings fail CI).

---

## Appendix — how this was verified
- Route/lib/component trees enumerated via filesystem walk.
- Dead-code claims verified by grepping for imports of each file across `src/` (0 hits = dead).
- Live-wiring claims verified by reading `layout.tsx`, `site-header.tsx`, `vdp-lead-actions.tsx`, `api/v1/vehicles/route.ts`, `admin/layout.tsx`, `admin-nav.tsx`, `middleware.ts`.
- "What's needed" cross-checked against the extracted 26-section SRS/BRD and the phased plan.
- Not exhaustively line-audited: every one of the 65 files carrying rental-era vocabulary (A3) — these need per-subsystem review during rewrite, not blind rename.
