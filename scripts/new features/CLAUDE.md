# CLAUDE.md — Cars 365 Syndication Module

You are adding a **multi-channel listing syndication module** to the existing Cars 365 platform (dealer website + staff/admin portal). Staff list a vehicle once in the admin portal; it publishes to external channels and leads flow back into one attributed inbox.

**You are extending a live production system that a real business depends on. The website must never break because of syndication work.**

---

## TASK 0 — DISCOVERY. DO THIS FIRST. WRITE NO FEATURE CODE.

Before implementing anything, produce these three artefacts and **stop for human review**:

1. **`docs/syndication/STACK.md`** — Detected language, framework, ORM, migration tool, job/cron mechanism, test runner, auth model, deployment target, env-var convention, existing folder conventions. Include the exact commands for: install, dev server, run tests, run a single test, lint, typecheck, create migration, run migration.
2. **`docs/syndication/FIELD-GAP.md`** — The existing vehicle/listing table(s) as-is, diffed against the required attributes in `docs/syndication/channels.md`. For every channel, list: fields present, fields missing, fields present but wrong shape (free text where an enum is required, miles vs km, etc.). Then query live data and report **what percentage of currently active vehicles would be rejected by each channel today, and why**.
3. **`docs/syndication/PLAN.md`** — Your implementation order, derived from the gap report.

That percentage in artefact 2 decides everything. If 60% of live cars lack a VIN, the first sprint is data backfill and admin form changes — not adapters. **Do not guess this number. Query it.**

Then stop and report. Wait for approval.

---

## HARD RULES — violating any of these is a failed change

1. **NEVER automate logins to channels that lack a public API.** No stored channel passwords, no headless browser posting to Gumtree/carsales/Autotrader. It breaks on every UI change, violates their terms, and gets the client's dealer account banned — an unrecoverable business failure. Non-API channels use the **feed URL** method only (see `channels.md`).
2. **NEVER mutate existing website tables.** Add new tables. Read existing data through a read-only projection (`docs/syndication/architecture.md` §2). Adapters must never touch raw legacy tables directly.
3. **NEVER serve or push a partially-rendered feed.** Every channel treats the feed as the complete inventory — omitted items are **deleted**. A truncated feed wipes the dealer's listings. See the Volume Guard rule below; it is mandatory, not optional.
4. **NEVER auto-publish AI-generated description text.** Generated copy is a draft requiring human approval before any channel push. Inaccurate vehicle advertising is a legal exposure, not a UX issue.
5. **NEVER log, echo, or commit credentials, OAuth tokens, refresh tokens, or webhook secrets.** Redact in all log paths. Tokens are encrypted at rest.
6. **NEVER push to a live channel from dev or test.** Requires `SYNDICATION_LIVE_PUSH=true` AND a non-development environment. Default is dry-run.
7. **NEVER silently swallow a channel rejection.** Every rejection is persisted with a plain-English cause and surfaced in the admin UI.
8. **NEVER skip webhook signature verification.** Unverified lead webhooks let anyone inject fake leads into the client's business.

---

## THE VOLUME GUARD (most important safety mechanism in this module)

Before a rendered feed is published or a catalog batch pushed:

```
if last_successful_run exists:
    drop_pct = (last.item_count - current.item_count) / last.item_count
    if drop_pct > FEED_MAX_DROP_PCT (default 0.20):
        ABORT. Keep serving the previous feed. Raise a critical alert.
        Require explicit human override (force=true, logged with actor).
```

Also abort if: current item count is 0 while the previous run was > 0; any adapter threw during render; the source projection query errored or returned partial results.

**Feed publishing is atomic.** Render to a temp storage key → validate (schema + volume guard + item count) → only then swap the served pointer. A failed render leaves the last-known-good feed in place. Never render in-place over the live file.

---

## Architecture invariants

- **One canonical vehicle shape.** Channel-specific values live in `channel_override`, never on the vehicle.
- **Adapters are pure transforms.** `transform(vehicle, dealer, location) → ChannelPayload | RejectionList`. No I/O, no DB, no clock, no randomness. Fully unit-testable against golden fixtures. Transport is a separate layer.
- **The same transform powers the UI validator and the sync engine.** The readiness check staff see in the editor must call the exact same code that runs at push time. Two implementations will drift and destroy trust in the feature.
- **`channel_listing` is the source of truth for publication state**, one row per `(vehicle_id, channel_code)`.
- **Two transport kinds:** `pull_feed` (we render, they fetch) and `push_api` (we upload). Most channels are pull. Do not build push infrastructure for a channel until its credentials actually exist.
- **`payload_hash` gates every push.** Unchanged payload → skip. Prevents rate-limiting and gives a free change audit log.
- **Idempotency everywhere.** Feeds are deterministic given the same input. Lead ingestion is deduped on `(channel_code, channel_lead_id)`.
- **Single-flight lock per `(dealer_id, channel_code)`.** Overlapping syncs for the same pair must be impossible.
- **Scope every query by `dealer_id`** even if there is only one dealer today.

---

## Definition of done (every PR)

- [ ] Migrations are additive and reversible. No `DROP`, no `ALTER ... TYPE` on existing website columns.
- [ ] New adapter has golden fixtures: one valid vehicle, and one fixture per documented rejection reason.
- [ ] Every new failure path has a persisted error record and a plain-English admin-visible message.
- [ ] Volume guard covered by a test that proves a truncated feed is rejected.
- [ ] Typecheck + lint + full test suite pass. No new warnings.
- [ ] No secrets in diff. No `console.log`/`dd()`/`print` of payloads containing PII or tokens.
- [ ] Website routes untouched, or if touched, explicitly justified in the PR description.
- [ ] Manual verification steps written in the PR body.

---

## Working style

- **Small, reviewable commits.** One concern per commit. Never bundle a migration with adapter logic.
- **Read before writing.** Match the existing codebase's conventions — naming, error handling, folder layout — over any preference of your own. If the repo uses snake_case and repository classes, do that.
- **When a channel spec is ambiguous, stop and ask.** Do not invent attribute names. A wrong attribute header means silent total feed rejection.
- **When you find a discrepancy between these docs and the live channel documentation, trust the live docs and flag the discrepancy.** These specs were written against documentation that changes without notice.
- **Never claim a channel integration works until you have seen a real successful response from that channel.** "Code complete" is not "working" for anything involving an external API.
- **Prefer boring.** Postgres-backed job queue over a broker. Cron over a scheduler service. One process over microservices. The team is four people.

---

## Reference docs

| Doc | Contents |
|---|---|
| `docs/syndication/architecture.md` | Schema, projection layer, adapter interface, sync engine, admin UI surfaces |
| `docs/syndication/channels.md` | Per-channel constraints, attributes, auth model, rejection codes |
| `docs/syndication/failure-modes.md` | Every known pitfall and its required handling. Read before implementing any adapter. |
| `docs/syndication/STACK.md` | Generated in Task 0 |
| `docs/syndication/FIELD-GAP.md` | Generated in Task 0 |

---

## Environment variables

```
SYNDICATION_LIVE_PUSH=false        # master safety switch; true only in prod
FEED_MAX_DROP_PCT=0.20             # volume guard threshold
FEED_STORAGE_BUCKET=
FEED_SIGNING_SECRET=               # high-entropy; used to derive per-dealer feed tokens
CREDENTIAL_ENCRYPTION_KEY=         # envelope encryption for stored OAuth tokens

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_MERCHANT_CENTER_ID=

META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
META_CATALOG_ID=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

ALERT_WEBHOOK_URL=                 # critical sync failures
```

Never commit `.env`. Add every new var to `.env.example` with a comment, no value.
