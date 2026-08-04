# Channel Specifications

**Verify every attribute name against live channel documentation before implementing.** These specs were written from documentation that changes without notice. A single wrong attribute header can cause silent rejection of an entire feed. When live docs disagree with this file, follow the live docs and flag the difference.

Implementation order is by external latency, not interest.

---

## Priority 0 — Meta Inventory Partner application (no code)

Meta requires dealers to list vehicles through an **approved Marketplace Inventory Partner**. Cars 365 would be applying to become one. This is the longest lead time in the project and costs nothing to start. Begin the application before any adapter work; the roadmap must not block on it.

---

## 1. Own site VDP — `own_site`

Not a channel, but it constrains everything. Google's landing-page requirements dictate the template, so build the VDP to Google's spec first and Google approval becomes a formality.

Required, visible **on page load without scrolling**:
- Dealership name and location (name + city acceptable if full address absent)
- Vehicle price — must match the price submitted in the feed
- VIN
- Availability
- For used vehicles: mileage, prominently, matching the feed's mileage attribute

Also: meet local new/used disclosure requirements; every vehicle in the feed must appear available on its landing page.

**Add an automated nightly assertion that VDP-rendered price equals feed price for every live listing.** Drift here causes mass disapproval.

---

## 2. Google Vehicle Ads — `google_vehicle_ads`

**Transport:** `pull_feed` (CSV) · **Auth:** OAuth 2.0 into Merchant Center · **First real channel.**

Available directly in Australia (also US, Canada) — enabled in the Merchant Center **Add-on** section. Several European markets are open beta. Note: if the Merchant Center account already has other data sources or programs active, the Vehicle Ads add-on may not be enablable — check this in Task 0.

**Prerequisites:** Merchant Center account · website verified and claimed · Google Ads account linked · Google Business Profile linked · Performance Max (or Standard Shopping with vehicle data source) campaign.

**Constraints to encode in `transform`:**
- Non-commercial passenger vehicles only. Utes are supported in Australia. Motorhomes, boats, buses, trains are not → reject `VEHICLE_TYPE_UNSUPPORTED`.
- Feed must contain vehicle offers only — no parts, accessories, or other shopping offers.
- **Exact attribute headers required.** Any deviation breaks processing.
- Each VIN appears exactly once. Multiple store codes / fulfilment types use repeated shop-code fields and the group attribute — never duplicate the VIN row → reject `DUPLICATE_VIN`.
- Google recommends starting with a handful of test vehicles before scaling to full inventory. **Do this. Ship a 5-vehicle feed first.**

**Rejection codes:** `MISSING_VIN`, `DUPLICATE_VIN`, `VEHICLE_TYPE_UNSUPPORTED`, `PRICE_MISMATCH_LANDING_PAGE`, `MILEAGE_MISMATCH`, `UNMAPPED_ENUM`, `MISSING_STORE_CODE`.

**Gotcha:** disapprovals surface on the Merchant Center "Needs attention" page and corrected listings take an unspecified time to go live. Do not treat a resubmit as instantly resolved — poll and reconcile.

---

## 3. Meta Marketplace Vehicles — `meta_marketplace`

**Transport:** `push_api` (catalog feed upload) · **Auth:** Facebook Login / Graph API · **Blocked on partner approval.**

Beta program covering Australia, Brazil, Canada, France, Germany, Mexico, UK, US.

**Constraints:**
- **Used and Certified Pre-Owned only.** New vehicles unsupported → reject `CONDITION_NOT_SUPPORTED`. This is why the canonical `condition` enum has no `new` value.
- Mileage must exceed **500 miles (~805 km)** unless the vehicle has a registration plate → reject `ODOMETER_TOO_LOW`. Store km canonically; convert at the adapter; use the rego-plate exemption where `rego` is present.
- **The catalog is fully replaced on every upload.** Removing an item from the feed marks it removed at the next ingest — and it may remain visible on Marketplace for ~24h after. The volume guard is critical here.
- `dealer_id` (your own string identifier) and `fb_page_id` (the dealership's professional page) support multiple rooftops in a single catalog. In the partner integration model, put your own page id in `fb_page_id`.
- Lead capture: **Messenger chat** or **lead form**. Leads go to the page linked in `fb_page_id`, retrieved via webhook or the Leads API.
- Metrics are exposed only as basic daily CSV from the catalog Settings page — do not build a dashboard expecting rich API metrics.

**Webhook handling:** verify `X-Hub-Signature-256` against `META_APP_SECRET` on every request. Respond 200 within 5 seconds — enqueue, never process inline. Meta disables endpoints that repeatedly fail. The Leads API checks the partner webhook response, so a non-200 has consequences beyond one lost lead.

---

## 4. WhatsApp catalogue — `whatsapp_catalog`

**Transport:** `push_api` · **Auth:** same Meta Commerce catalog infrastructure as channel 3.

Low marginal cost once Meta is done — reuses the catalog. Catalog items are generic product-shaped; put a short vehicle summary in the item and **deep-link to the VDP** for full detail. Do not attempt to represent full vehicle specs in catalog fields.

Check current catalog item limits at implementation time and enforce a cap in the adapter with a documented selection rule (e.g. newest N active vehicles) rather than failing the whole push.

---

## 5. Gumtree / AU classifieds — `gumtree`, `carsales`, `autotrader_au`

**Transport:** `pull_feed` · **Auth:** `feed_url` · **This is a commercial workstream, not an engineering one.**

No public API. Gumtree Australia sits with CarsGuide and Autotrader.com.au under The Market Herald. In Australia, dealer inventory typically reaches these platforms through incumbent rails — Dealer Solutions (Cox Automotive AU), AutoGate, EasyCars.

**Two strategic paths — the client must choose before build:**
1. **Ride the rails** — output a feed in the incumbent provider's format. Faster, lower risk, but you are a step in someone else's pipeline.
2. **Direct commercial agreement** with each platform. Slower, requires business development, higher value.

**Engineering deliverable either way:** a generic, well-documented XML/CSV feed endpoint per dealer per channel, plus the copyable URL and install instructions in the admin UI. Staff or the channel's support team pastes the URL into the dealer account once.

**Do not implement headless-browser posting.** See CLAUDE.md Hard Rule 1.

---

## 6. TikTok display sync — `tiktok_display`

**Transport:** `push_api`-ish (read-only pull from TikTok) · **Auth:** OAuth.

**The TikTok Shop Seller API cannot list vehicles** — it is for physical e-commerce products. Anyone pointing you at the Shop Seller API docs for this is on the wrong track.

The actual feature: pull the dealership's **own** TikTok videos via the TikTok Display API / oEmbed, match each to a vehicle by stock number parsed from the caption (or a manual `tiktok_url` field on the vehicle), and render the embed on the VDP plus a "As seen on TikTok" section on the website.

Scope: ~2 days. No commerce, no listing push, no lead capture. Cache embeds; do not hit TikTok on page render.

---

## Channel capability matrix

| Channel | Transport | Auth | Leads | New vehicles | Blocked on |
|---|---|---|---|---|---|
| `own_site` | — | — | Web form | Yes | Nothing |
| `google_vehicle_ads` | pull_feed | OAuth | Lead form | Yes* | Merchant Center setup |
| `meta_marketplace` | push_api | OAuth | Messenger / lead form | **No** | Partner approval |
| `whatsapp_catalog` | push_api | OAuth | Chat | No | Meta catalog |
| `gumtree` / `carsales` | pull_feed | feed_url | Platform inbox | Varies | Commercial agreement |
| `tiktok_display` | read-only | OAuth | None | n/a | Nothing |

\* Google supports new vehicles, but only non-commercial passenger types.

---

## Adding a new channel — checklist

1. Row in `channel` with `transport_kind`, `auth_kind`, `capabilities`
2. Adapter implementing `transform` (pure) + `renderFeed` or `push`
3. Enum mappings seeded in `channel_enum_map` for every canonical value
4. Golden fixtures: one valid vehicle + one per documented rejection code
5. Rejection codes documented here with plain-English messages and fix hints
6. Connection card in Settings → Connections with the correct auth flow
7. Volume guard verified by test
8. Added to the nightly reconciliation job
9. **Confirmed working against the real channel with a real successful response** before marking done
