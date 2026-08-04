# FIELD-GAP.md — Task 0 artefact 2

**Every percentage below was produced by querying the live database, not estimated.**
Audit script: read-only `SELECT` over `public.vehicles` + `vehicle_images`, run 2026-08-04.

## Headline finding

> ### 100% of active inventory would be rejected by Google Vehicle Ads today.
> **Every one of the 38 active vehicles has a NULL VIN.** VIN is mandatory and must be
> unique per row. There is no adapter, mapping table or transform that works around this.

`CLAUDE.md` anticipated exactly this case: *"If 60% of live cars lack a VIN, the first
sprint is data backfill and admin form changes — not adapters."* The real number is 100%.
**Sprint 1 is data capture. Adapter work cannot start.**

## Inventory snapshot

| Metric | Value |
|---|---|
| Total vehicle rows | 40 |
| By status | `available` 38, `draft` 1, `sold` 1 |
| **Active (available + reserved)** | **38** ← denominator for every percentage below |
| Duplicate VINs among active | 0 (trivially — all VINs are NULL) |

The dataset is small enough that percentages are coarse: one vehicle ≈ 2.6%.

## Field presence on active vehicles

| Field | Missing | % missing | Required by |
|---|---:|---:|---|
| `vin` | 38 / 38 | **100.0%** | **Google (mandatory)**, Meta (recommended) |
| `description` | 22 / 38 | 57.9% | All channels; Meta requires non-empty |
| `registration` (rego) | 23 / 38 | 60.5% | Meta odometer exemption; AU classifieds |
| `rego_expiry` | 21 / 38 | 55.3% | AU classifieds |
| `seats` | 16 / 38 | 42.1% | Google (recommended) |
| `exterior_color` | 16 / 38 | 42.1% | Google/Meta colour attribute |
| `doors` | 15 / 38 | 39.5% | Google (recommended) |
| `drive_type` | 14 / 38 | 36.8% | Google (recommended) |
| `engine` | 11 / 38 | 28.9% | Classifieds |
| `mileage_km` = 0 | 1 / 38 | 2.6% | Meta rejects ≤ 805 km without rego |
| `price` missing/≤0 | 0 / 38 | 0.0% | — |
| `body_type` | 0 / 38 | 0.0% | — |
| `fuel_type` / `transmission` | 0 / 38 | 0.0% | — |
| `location_id` (store code) | 0 / 38 | 0.0% | — |
| No images | 0 / 38 | 0.0% | — |
| Fewer than 3 images | 0 / 38 | 0.0% | — |

**Good news:** price, body type, fuel, transmission, store code and photography are 100%
populated. Media is genuinely healthy — every active vehicle has images (11–17 in the
sample). The gap is concentrated in **compliance identity** (VIN, rego) and
**narrative/spec detail**.

## Simulated channel rejection, today

### Google Vehicle Ads — rejects 38/38 (100.0%)

| Rejection code | Count | % |
|---|---:|---:|
| `MISSING_VIN` | 38 | 100.0% |

No other Google-blocking gap exists. Fix VIN and this channel goes from 0% to ~100% eligible.

### Meta Marketplace — rejects 1/38 (2.6%)

| Rejection code | Count | % |
|---|---:|---:|
| `ODOMETER_TOO_LOW` | 1 | 2.6% |

One vehicle has `mileage_km = 0` and no rego, so it fails the 500-mile (805 km) rule with
no plate exemption. **Meta is by far the most attainable channel on current data** — but it
is blocked commercially on Inventory Partner approval, which is the longest lead time in
the project (`channels.md` Priority 0).

## Fields present but wrong shape

| Field | Issue | Impact |
|---|---|---|
| `vehicles.vin` | Column exists, is `text`, **unconstrained and 100% NULL**. No length check, no checksum, not unique. | Backfill needs validation added at the same time, or bad VINs enter the feed. |
| **VIN data entry** | **Correction to an earlier reading of this gap:** the admin form *does* already expose a VIN input — `src/components/admin/vehicle-form.tsx`, in the **Specs** tab, unlabelled as important and with no prompt. `vehicleCreateSchema` also already validates it as exactly 17 characters. So this is not "staff cannot enter a VIN"; it is "nothing tells them it matters." | Changes the Sprint 1 fix from *add a field* to *make the field consequential*: surface it in a dedicated Identity & Compliance section, show what breaks without it, and give staff a queue of the vehicles still missing one. |
| `stock_id` | At least one row uses the rego as the stock ID (`CRQ30E`). | `stock_id` is the natural `external_id`/offer id. Overlapping it with rego is a data-hygiene risk, not a blocker. |
| `condition` | **Does not exist.** All inventory is implicitly used. | Meta needs `used`/`cpo`, never `new`. Add to the sidecar with a `used` default. |
| `price_type` | **Does not exist.** `price` is a bare `numeric`. | `failure-modes.md` F8: `price_type` is mandatory and must never be inferred. Drive-away vs ex-government is a misleading-price exposure. **Add to sidecar; do not default it silently.** |
| `build_date` / `compliance_date` | **Do not exist.** Only `year` (integer). | AU classifieds expect build/compliance. Sidecar. |
| `wovr_flag` | **Does not exist.** | `failure-modes.md` F27 — written-off disclosure is a legal obligation in Australia. Sidecar, and block publish where a channel has no disclosure field. |
| `badge` | **Does not exist.** `variant` is free text. | Acceptable; map `variant` → `variant`, leave `badge` NULL. |
| `engine_cc` | Only free-text `engine`. | Sidecar if a channel requires numeric displacement. |
| `description_generated` / `description_approved_at` | **Do not exist.** | Hard Rule 4 — generated copy must never auto-publish. Sidecar. |
| `version` (optimistic lock) | **Does not exist.** | F13 concurrent-edit protection. Sidecar or a new column on the sidecar keyed to the vehicle. |
| `dealer_id` | **Does not exist. There is no multi-tenancy at all.** | `architecture.md` assumes `dealer_id` everywhere. See PLAN.md §Decision 1. |
| `media_assets.processing_status` | Not verified as present. | F25 requires `ready` before publish. Confirm in Sprint 1. |

## Enum values needing `channel_enum_map` rows

Live distinct values (the full set that must be mapped per channel before any publish):

```
body_type    : hatch, people_mover, sedan, suv, ute, van, wagon
fuel_type    : diesel, petrol
transmission : automatic, manual
drive_type   : awd, four_wd, fwd, rwd
```

The schema enums are wider than live data (`body_type` also allows `coupe`, `convertible`;
`fuel_type` also allows `hybrid`, `phev`, `electric`, `lpg`; `transmission` also `cvt`,
`dct`). **Seed mappings for the full enum, not just observed values** — otherwise the first
electric car listed triggers `UNMAPPED_ENUM` at publish time.

Note `ute` for Google: utes are supported in Australia, so it maps rather than rejecting.

## What this means

1. **No adapter can be built usefully yet.** A Google adapter against current data would
   reject 100% of inventory, and its golden fixtures would encode a shape no live row has.
2. **The binding constraint is data entry, not code.** 38 VINs must be physically read off
   38 windscreens/compliance plates and typed in. That is an operations task with a
   software dependency (the admin form field + validation), not an engineering task.
3. **Meta is the better first channel on data readiness** (2.6% rejection) but is blocked
   on partner approval. Google is the better first channel on *availability* but is blocked
   on data. This asymmetry drives the plan.
4. **Two legally-loaded fields are entirely absent** — `price_type` (F8) and `wovr_flag`
   (F27). Both must exist and be explicitly set before anything publishes.
