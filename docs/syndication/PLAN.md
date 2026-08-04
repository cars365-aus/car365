# PLAN.md — Task 0 artefact 3

Implementation order derived from FIELD-GAP.md. **Nothing here is built yet — this is the
plan submitted for approval per `CLAUDE.md` Task 0.**

## The constraint that sets the order

100% of active vehicles lack a VIN. Google Vehicle Ads — the designated first real channel —
rejects 100% of inventory today, and the only fix is 38 VINs being read off physical
vehicles and entered by staff. Meta rejects only 2.6% but is blocked on Inventory Partner
approval, the longest external lead time in the project.

So the critical path is: **start the Meta application immediately (zero code), build data
capture first, and only then build the Google adapter** — by which time the VINs exist.

---

## Decisions needed from you before Sprint 1

### Decision 1 — `dealer_id` when there is no multi-tenancy *(blocking)*

`architecture.md` scopes every table and query by `dealer_id`. This platform is
explicitly single-company: there is no `dealers` table, no tenant column anywhere.

**Recommendation:** introduce a `syndication_dealer` table with exactly one seeded row, and
carry a real `dealer_id` FK on every syndication table from day one. It costs one table now
and avoids a painful retrofit if Cars 365 ever becomes the Meta Inventory *Partner*
described in `channels.md` Priority 0 — in which case it would be syndicating on behalf of
multiple rooftops, and `fb_page_id`/`dealer_id` per rooftop becomes essential.

*Alternative:* skip it and hardcode a constant. Cheaper now, expensive later. I do not
recommend it given the partner ambition is already in scope.

### Decision 2 — Gumtree / carsales strategy *(blocking for Sprint 5, not earlier)*

`channels.md` §5 requires a commercial choice between riding incumbent rails (Dealer
Solutions / AutoGate / EasyCars format) and direct agreements. This is a business
decision. Engineering output is identical either way (a generic feed endpoint + copyable
URL), so this does not block Sprints 1–4 — but the *format* is unknowable until chosen.

### Decision 3 — `price_type` for existing stock *(blocking Sprint 1 backfill)*

`failure-modes.md` F8 forbids inferring it. All 38 vehicles need an explicit
`drive_away` or `ex_gov` value. Someone who knows how Cars 365 advertises must state the
default, and confirm whether it is uniform across current stock.

### Decision 4 — job runner *(blocking Sprint 3)*

There is no scheduler: `vercel.json` has `crons: []`, and the one cron route is externally
triggered. Options: (a) Vercel Cron, (b) Supabase `pg_cron` + edge function — matching the
existing `search_index_jobs` precedent, (c) external scheduler hitting a secured route.
**Recommendation: (b)**, because the pattern already exists in this repo and "prefer boring"
argues against adding a new platform primitive.

---

## Sprint plan

### Sprint 0 — Commercial, parallel, no code *(start today)*
- Submit the **Meta Marketplace Inventory Partner application**. Longest lead time; costs
  nothing to start; roadmap must not block on it.
- Confirm Merchant Center prerequisites: account exists, website verified + claimed, Google
  Ads linked, Google Business Profile linked. **Check the Vehicle Ads add-on is actually
  enablable** — `channels.md` warns it may not be if other data sources/programs are active.
- Resolve Decisions 1–4 above.

### Sprint 1 — Data capture and backfill *(the real first sprint)*
The gap report says this, not adapters.

1. **Migration `0014_syndication_sidecar.sql`** — additive only, no changes to `vehicles`:
   `syndication_vehicle_extra (vehicle_id PK/FK, vin, rego_state, condition, price_type,
   build_date, compliance_date, wovr_flag, engine_cc, badge, description_generated,
   description_approved_at, version, created_at, updated_at)`.
   VIN gets a 17-char format constraint and a partial unique index. Hard Rule 2 respected:
   legacy tables untouched.
2. **Admin vehicle editor** — an "Identity & Compliance" panel for rego state, condition,
   price type, build/compliance date, WOVR and badge, with an inline readiness list.
   *Note:* the VIN input already exists (Specs tab) and is already length-validated — the
   gap is that nothing communicates that it matters, so the fix is prominence and
   consequence, not a new field.
3. **Backfill queue** — a banner on the inventory list counting exactly what is blocking
   publication, so the 38-missing-VIN number is visible to the people who can fix it. This
   is the actual unblocking activity.
4. **`syndication_vehicle_projection` view** — the read-only seam of `architecture.md` §2,
   `vehicles` LEFT JOIN the sidecar. Adapters read only this.
5. Confirm `media_assets.processing_status` exists (F25); add if not.

**Exit criterion: VIN coverage ≥ 95% of active inventory.** Adapter work does not start
until this is met — that is the whole point of the gap audit.

### Sprint 2 — Channel core + the pure transform

**Partially delivered.** The parts with no dependency on vehicle data were built
ahead of the VIN backfill, since they cannot be validated by it either way:

- ✅ Migration `0015_syndication_channels.sql` — `channel`, `channel_connection`,
  `channel_listing`, `channel_override`, `channel_enum_map`, `sync_run`,
  `syndication_event`, plus the indexes in `architecture.md` §4. Every channel seeded
  **disabled**, so applying it cannot publish anything.
- ✅ `channel_enum_map` seeded across the **full** schema enum surface for Google and
  Meta, with a CI test that parses the migration and fails on any gap.
- ✅ Volume guard (`src/lib/syndication/volume-guard.ts`) — pure, with all mandated
  abort cases covered by test.
- ✅ Enum resolution (`src/lib/syndication/enum-map.ts`) — hard-rejects on unmapped,
  never defaults.
- ⏸ **Still blocked on the Sprint 1 VIN exit criterion:**

- `ChannelAdapter` interface; **`transform` pure — no I/O, no clock, no randomness.**
- Google adapter `transform`, with frozen header constant (F10) and golden fixtures:
  one valid vehicle plus one per rejection code (`MISSING_VIN`, `DUPLICATE_VIN`,
  `VEHICLE_TYPE_UNSUPPORTED`, `UNMAPPED_ENUM`, `MISSING_STORE_CODE`, `MEDIA_NOT_READY`).
- **Inline readiness validator in the vehicle editor calling the identical transform** —
  the same code path as publish, per the architecture invariant.

### Sprint 3 — Sync engine
- Single-flight lock per `(dealer_id, channel_code)`, released in `finally` (F12).
- Wire the (already-built and tested) volume guard into the publish path, persisting
  `volume_guard_tripped` / `forced_by` to `sync_run`.
- Atomic feed publish: temp key → validate → pointer swap. Never render in place.
- `payload_hash` gating; stable hashing (sorted keys, fixed number formatting, no timestamps).
- Feed URL + HMAC token, rotatable, 7-day grace on rotation (F18).
- `SYNDICATION_LIVE_PUSH` defaults false; live push requires the flag **and** a non-dev
  environment (F23).

### Sprint 4 — Google Vehicle Ads live
- **Ship a 5-vehicle feed first**, as Google explicitly recommends. Do not scale to full
  inventory until it processes clean.
- Nightly VDP-price-vs-feed-price assertion (F8) — this is also why the VDP must show
  price, VIN, mileage and availability above the fold per `channels.md` §1.
- Reconciliation job; Merchant Center "Needs attention" polling.
- Not "done" until a real successful response from Google is observed.

### Sprint 5 — Meta *(only if partner approval landed)*
Catalog push, `X-Hub-Signature-256` verification with constant-time compare (F4), 200-within-5s
by enqueueing (F21), `UNIQUE(channel_code, channel_lead_id)` dedupe, nullable `lead.vehicle_id`
(F20), sold fast-lane with the ~24h Meta removal lag surfaced in the UI (F3).

### Sprint 6+ — Leads inbox, WhatsApp catalogue, classifieds feed, TikTok display
TikTok is ~2 days and independent of everything above — a good filler sprint. Note the
TikTok **Shop Seller API cannot list vehicles**; the feature is Display API embeds matched
by stock number.

---

## Explicitly not doing

- **No headless-browser posting** to Gumtree/carsales/Autotrader, ever (Hard Rule 1 / F2).
  If asked, escalate.
- **No writes to existing website tables** (Hard Rule 2). Sidecar + projection only.
- **No auto-publish of generated descriptions** (Hard Rule 4).
- **No adapter work before Sprint 1's VIN exit criterion is met.**

## Risks

| Risk | Mitigation |
|---|---|
| VIN backfill stalls — it is manual physical work | Sprint 1 ships the *tooling*; escalate early if the list is not shrinking. Meta needs no VIN, so it is the fallback first channel. |
| Meta partner approval never lands | Google becomes the only push channel; classifieds feed URLs become higher priority. |
| Single-vehicle percentages (n=38) | The dataset is tiny; re-run the audit before each sprint rather than trusting these figures as stock grows. |
| No job runner exists | Decision 4 must be resolved before Sprint 3, not during it. |

---

**Status: awaiting approval. No syndication feature code has been written.**
