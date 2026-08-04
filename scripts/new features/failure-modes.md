# Failure Modes & Required Handling

Read this before implementing any adapter. Each entry is a real failure mode with mandatory handling. Ordered roughly by severity.

---

## CATASTROPHIC — these destroy the client's business, not just your feature

### F1. Truncated feed deletes the dealer's entire inventory
Every channel treats the feed as the complete inventory; omitted items are deleted. If feed generation partially fails — DB timeout, one adapter throws, storage write truncates — you publish a short feed and the channel removes everything missing.

**Required:** the Volume Guard (CLAUDE.md). Plus: render to a temp key, validate, atomic pointer swap. Never render in place. Abort on any adapter exception rather than publishing partial output. `item_count == 0` with a non-zero previous run is always an abort.

### F2. Headless-browser posting gets the dealer's account banned
Automating logins to Gumtree/carsales/Autotrader violates their terms. Account termination is not recoverable and destroys the client relationship.

**Required:** feed-URL method only. No stored channel passwords. If someone asks for this feature, escalate rather than implement.

### F3. Sold vehicles remain advertised
Advertising a vehicle no longer available is a bait-advertising exposure under Australian Consumer Law.

**Required:** sold fast-lane (immediate removal push on `status → sold`, bypassing debounce and queue priority). Nightly reconciliation catches anything missed. Auto-remove-on-sold is not user-disableable. Surface the channel's own removal lag in the UI (Meta ~24h) so staff don't assume a bug.

### F4. Unverified lead webhooks let anyone inject fake leads
An unauthenticated webhook endpoint means a competitor can flood the client's sales team with fabricated enquiries, or poison the attribution data the pricing model depends on.

**Required:** verify `X-Hub-Signature-256` (HMAC-SHA256 with app secret, constant-time compare) on every Meta request. Reject unsigned or mismatched with 401 and log. Enforce a timestamp freshness window to blunt replay.

### F5. Published misinformation from unreviewed AI copy
LLM-generated descriptions hallucinate features ("heated seats", "full service history") that the vehicle does not have. That is a false advertising claim against the dealer.

**Required:** generated text is a draft. `description_approved_at IS NULL` blocks publishing generated copy on every channel. Generation may only assert facts present in structured fields; a prompt is not a guarantee, so also diff generated text against the feature list and flag unsupported claims for review.

---

## HIGH — silent data corruption and mass rejection

### F6. Unmapped enum silently defaults
Defaulting an unknown body type to "Sedan" publishes a factually wrong ad.

**Required:** unmapped value → hard rejection `UNMAPPED_ENUM`, surfaced to staff with the exact value that needs mapping. Never default. Never guess.

### F7. Unit confusion (km vs miles)
Meta's threshold is 500 **miles** (~805 km). Australian odometers are in km. Getting this backwards either rejects the whole inventory or publishes 8x-wrong mileage.

**Required:** store `odometer_km` as integer km, canonically, always. Convert only inside the adapter. Name every variable with its unit. Unit-test the boundary: 804 km rejects, 806 km passes, 400 km with a rego plate passes.

### F8. Price semantics mismatch
Australian drive-away price includes on-road costs; ex-government does not. Submitting the wrong one to a channel that expects the other is both a disapproval risk and a misleading-price exposure. Google additionally requires the landing-page price to match the feed.

**Required:** `price_type` is mandatory, never inferred. Nightly assertion that VDP-rendered price equals feed price for every live listing; mismatch raises a critical alert. Any MSRP disclaimers must be displayed on the landing page.

### F9. Duplicate VIN in feed
Google requires each VIN exactly once; multi-location availability uses repeated shop codes.

**Required:** pre-render uniqueness check on VIN. Duplicate → reject both rows with `DUPLICATE_VIN` naming the conflicting stock numbers. Do not silently pick one.

### F10. Wrong attribute headers
Exact headers are required. A typo can reject the entire feed with an opaque error.

**Required:** headers defined as a single frozen constant per adapter, asserted in a golden-fixture test against a byte-exact expected file. Never build headers dynamically from object keys.

### F11. Field gaps discovered mid-build
The existing website schema will not have VIN, compliance date, or canonical enums. Discovering this in week 3 wastes weeks.

**Required:** Task 0 field gap audit with real percentages from live data, before any adapter work.

---

## MEDIUM — operational reliability

### F12. Overlapping sync runs
Two concurrent runs for the same `(dealer, channel)` produce interleaved pushes and corrupt `payload_hash` state.

**Required:** single-flight advisory lock per pair, released in a `finally` block. Stale-lock timeout so a crashed worker cannot block forever.

### F13. Concurrent edits by two staff members
Staff A publishes while Staff B edits; the pushed payload reflects neither.

**Required:** optimistic locking on `version`. Version mismatch on save → surface a conflict to the user, do not last-write-win.

### F14. Rate limiting and thundering herds
Pushing 1,000 vehicles the moment a nightly job fires hits per-channel limits.

**Required:** per-channel token bucket. Exponential backoff with **jitter** on 429/5xx. Retry only idempotent operations. Cap retries, then dead-letter with the raw response persisted. Never retry a 4xx validation error — it will fail identically.

### F15. Needless pushes cause flagging
Re-pushing unchanged listings wastes quota and can flag the account.

**Required:** `payload_hash` computed on the rendered payload; skip if unchanged. Hash must be stable — sort keys, fix number formatting, exclude timestamps from the hashed content.

### F16. OAuth token expiry looks like a silent outage
A refresh token revoked when someone changes a password stops syndication with no visible cause.

**Required:** hourly refresh job for anything expiring within 24h. On refresh failure, set connection `status = action_needed`, show a prominent admin banner naming the channel and the fix, and fire the alert webhook. Never retry-loop silently.

### F17. Credential leakage
Tokens in logs, error traces, Sentry payloads, or committed `.env` files.

**Required:** envelope encryption at rest with `CREDENTIAL_ENCRYPTION_KEY`. A redaction filter in the logging layer keyed on field name (`*token*`, `*secret*`, `*password*`, `authorization`). Never include raw request bodies in error reports without redaction. Truncate `raw_response` stored on `sync_run`.

### F18. Feed URL rotation silently breaks a channel
Rotating the token invalidates the URL the channel is polling; nobody notices until listings vanish.

**Required:** rotation is behind a typed confirmation explaining that the URL must be re-pasted at the channel. Keep the old token valid for a 7-day grace period. Alert if the old URL is still being fetched after rotation.

### F19. Rejections invisible to staff
A car silently fails to publish and the dealer finds out from a customer. This loses accounts.

**Required:** every rejection persisted with `rejection_code` + plain-English `message` + `fixHint`, shown inline in the vehicle editor and as a filter in the inventory list. Daily digest of rejected vehicles. Alert on rejection-rate spike (>2x trailing 7-day average).

### F20. Leads lost when a vehicle is deleted
A lead arrives for a vehicle removed from the DB; a non-null FK drops the lead.

**Required:** `lead.vehicle_id` is nullable. Preserve `raw_payload` always. Never discard a lead because it cannot be matched — file it as unmatched and surface it.

### F21. Webhook retries create duplicate leads
Channels retry until they get a 200. Slow processing means the same lead lands three times.

**Required:** `UNIQUE(channel_code, channel_lead_id)`, upsert semantics. Respond 200 within 5s by enqueueing, never processing inline.

### F22. Reconciliation drift accumulates
`channel_listing.state` says `live` but the channel dropped it weeks ago.

**Required:** nightly reconciliation comparing should-be-live against channel-reported-live (or feed ingest confirmation where no read API exists). Persist drift, alert above a threshold, and mark `last_seen_live_at` so staleness is queryable.

### F23. Dev environment pushes to production channels
A developer running the sync job locally publishes garbage to the client's live Marketplace catalog.

**Required:** `SYNDICATION_LIVE_PUSH` defaults false. Live push requires that flag **and** a non-development environment. Dry-run mode writes to `sync_run` and logs the payload without transmitting. Fail loudly at startup if a live channel credential is present in a dev environment.

---

## LOW — quality and compliance details

### F24. Timezone and DST errors
Dealer opening hours, feed timestamps, and scheduled runs across AEST/AEDT.

**Required:** UTC in the database, always. Convert at the boundary using the dealer's IANA zone (`Australia/Sydney`, not a fixed offset). Never store or compute with fixed offsets.

### F25. Image pipeline failures block publishing
A channel requires a minimum photo count and dimensions; a still-processing upload yields a broken listing.

**Required:** publishing requires `processing_status = ready` on the minimum number of photos. Reject with `MEDIA_NOT_READY` rather than pushing a listing with missing images. Serve CDN URLs, never signed-expiring URLs, in feeds — channels cache and re-fetch.

### F26. PII retention and deletion
Lead contact data is personal information under the Australian Privacy Principles.

**Required:** encrypt contact fields at rest. Documented retention period with an automated purge job. A deletion path that removes a lead's PII while preserving anonymised outcome data for attribution reporting.

### F27. WOVR / written-off vehicle disclosure
Australian obligations around disclosing repairable write-offs.

**Required:** `wovr_flag` on the projection; where a channel supports a disclosure field, populate it; where it does not, require the disclosure in the description and block publish if absent.

### F28. Vehicle type creep
A dealer lists a motorhome or a truck; Google supports neither.

**Required:** explicit allow-list of body types per channel. Anything outside it rejects with `VEHICLE_TYPE_UNSUPPORTED` and a clear explanation rather than failing at the channel.

### F29. Title/description length overflow
Channels truncate or reject over-length fields, often mid-word.

**Required:** length limits in `channel.capabilities`. Truncate at a word boundary with a warning, or reject if the limit makes the listing meaningless. Never silently hard-truncate. `channel_override` lets staff supply a custom short title.

---

## Testing requirements

**Golden fixtures per adapter:** one fully valid vehicle producing a byte-exact expected payload, plus one fixture per documented rejection code.

**Mandatory test cases:**
- Volume guard rejects a feed that drops >20% of items
- Volume guard rejects a zero-item feed following a non-zero run
- Failed render leaves the previous feed served (atomic swap)
- Odometer boundary: 804 km rejects, 806 km passes, 400 km with rego passes
- Unmapped enum rejects rather than defaulting
- Duplicate VIN rejects both rows
- `payload_hash` is stable across two renders of unchanged input
- Webhook with an invalid signature returns 401 and creates no lead
- Duplicate `channel_lead_id` creates exactly one lead
- Lead with an unknown vehicle is stored with a null `vehicle_id`
- Live push is blocked when `SYNDICATION_LIVE_PUSH=false`
- Concurrent sync attempts for the same pair: second aborts
- Feed headers match the frozen constant byte-for-byte

**Seed data must include the ugly cases:** no VIN, 0 km, no photos, sold-but-still-marked-live, unmapped body type, missing price, over-length title, motorhome.

**Never mark a channel integration done without a real successful response from that channel.** Passing tests against fixtures proves the transform is right, not that the integration works.
