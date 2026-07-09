# Vehicle Listing Search Visibility Bugfix Design

## Overview

Newly listed and approved vehicles are saved to the database but never become reliably
discoverable on the public listing surfaces (home page, `/api/search` results, and the
city / city+category pSEO pages). They may flash into view immediately after listing
(via Next.js path revalidation and optimistic rendering), but on refresh they vanish and
cannot be found by location search or category browsing with a location filter applied.

The codebase already has all the right moving parts:

- Every write path (`createVehicle`, `updateVehicle`, `deleteVehicle`, bulk actions,
  admin/vendor moderation approve/reject) correctly **enqueues** a row into the
  `search_index_jobs` queue with `operation = upsert | delete` and `status = pending`.
- Two **processors** exist that drain that queue into Typesense:
  `processSearchIndexJobs()` in `src/lib/search/typesense.ts` (Node/Next runtime) and the
  `search-index-worker` Supabase Edge Function (`supabase/functions/search-index-worker/index.ts`).
- Every public listing surface reads from Typesense through `searchVehicles()`, which only
  falls back to a direct database query when Typesense is **unconfigured** or **throws**.

The defect is the missing link between the two: **nothing ever runs the processor on a
schedule.** `vercel.json` schedules only `/api/cron/daily-blog`; no route calls
`processSearchIndexJobs()`; `/api/search/reindex` is a health-check stub; and no pg_cron
job or Vercel cron triggers the Edge Function. So `upsert` jobs for newly approved vehicles
remain `pending` indefinitely, the Typesense index goes stale, and because Typesense is the
authoritative source for the listing surfaces (the DB fallback only fires when Typesense is
absent/erroring), the new vehicles never surface.

The fix is minimal and targeted: introduce a scheduled trigger that drains the queue within
a bounded, predictable time, plus a one-time reconciliation/backfill so vehicles that are
already approved but missing from the index (the existing Corvette-in-Sydney case) become
discoverable. No query logic, filtering, ranking, or write-path behavior changes.

## Glossary

- **Bug_Condition (C)**: A vehicle `X` is publicly eligible (approved vehicle + approved
  organization + approved branch) but is not present in the Typesense-backed listing surfaces
  because its queued index `upsert` was never processed (or no job exists for it).
- **Property (P)**: When the bug condition holds, the fixed system makes `X` discoverable on
  all listing surfaces (location search, category+location browse, post-refresh listings)
  within a bounded time.
- **Preservation**: All behavior for vehicles that are already correctly indexed, for
  non-eligible vehicles, for filtering/sorting, and for image/vendor/pricing resolution must
  remain exactly as it is today.
- **`search_index_jobs`**: The Postgres queue table (`pending | processing | complete | failed`,
  with `attempts`, `last_error`, `next_run_at`) holding pending index mutations.
- **`processSearchIndexJobs(limit)`**: The existing Node-runtime drainer in
  `src/lib/search/typesense.ts` that reads `pending` jobs, upserts/deletes Typesense documents,
  and marks jobs `complete` / `failed`.
- **`search-index-worker`**: The existing Supabase Edge Function drainer with retry/backoff
  (`attempts < 3`, exponential `next_run_at`).
- **`searchVehicles(query, filters, options)`**: The read path powering every listing surface;
  uses Typesense when configured, otherwise falls back to a direct DB query.
- **`isPubliclyEligible(X)`**: `X.status = approved` AND `X.organization.status = approved`
  AND `X.branch.status = approved`.
- **`isVisibleInListingSurfaces(X)`**: `X` is returned by `searchVehicles` for its city /
  city+category.

## Bug Details

### Bug Condition

The bug manifests whenever a publicly eligible vehicle exists in the database but its
search-index document is missing or stale. The enqueue side works; the **drain** side is
never triggered, so `upsert` jobs stay `pending` and Typesense never learns about the vehicle.
Because the listing surfaces read Typesense (DB fallback only on absence/error), the vehicle
is effectively invisible to discovery.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type Vehicle
  OUTPUT: boolean

  RETURN isPubliclyEligible(X)            // approved vehicle + approved org + approved branch
         AND NOT isVisibleInListingSurfaces(X)   // not returned by searchVehicles for its city/category
END FUNCTION

// Underlying mechanical cause:
//   There exists a pending 'upsert' job for X in search_index_jobs (or none was ever needed
//   to be re-run), AND no scheduled process ever calls processSearchIndexJobs() /
//   search-index-worker, so the Typesense document for X is never written.
```

### Examples

- **Corvette / Sydney / Luxury (reported case)**: A vendor lists a Corvette in Sydney under
  Luxury. `createVehicle` writes the row with `status = approved` (org approved) and enqueues
  a `pending` `upsert` job. The job is never processed. Searching "Sydney" returns no Corvette;
  browsing Luxury filtered to Sydney returns no Corvette. Expected: it appears in both.
- **Any newly approved vehicle**: Vendor lists in an approved org → transient appearance via
  revalidation, then gone on refresh. Expected: persistently listed.
- **Admin approval of a pending vehicle**: Admin approves a previously pending vehicle
  (`admin/actions.ts` enqueues an `upsert`). The job never runs → vehicle stays absent from
  search. Expected: becomes discoverable shortly after approval.
- **Edge case — Typesense not configured**: `searchVehicles` falls back to the live DB query,
  so vehicles *do* appear. This is NOT the bug condition (it is already correct) and must stay
  correct after the fix.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Vehicles already present in the Typesense index continue to return with identical search,
  filter, and sort results (Requirement 3.1).
- Non-approved vehicles (pending, suspended, rejected, or under a non-approved org/branch)
  continue to be excluded from public surfaces (Requirement 3.2).
- Location, category, price, seats, transmission, and fuel filters continue to return only
  matching vehicles (Requirement 3.3).
- Removed/suspended/rejected vehicles continue to drop off public surfaces; their `delete`
  jobs continue to be honored (Requirement 3.4).
- Image resolution, vendor/branch details, and pricing continue to resolve exactly as today
  (Requirement 3.5).
- The DB fallback path in `searchVehicles` (used when Typesense is unconfigured/erroring) is
  unchanged.
- All write-path enqueue logic (`createVehicle`, `updateVehicle`, `deleteVehicle`, bulk
  actions, moderation) is unchanged.

**Scope:**
All inputs that do NOT satisfy the bug condition must be completely unaffected. This includes:
- Vehicles already discoverable in search.
- Non-eligible vehicles (must remain excluded).
- The Typesense-not-configured environment (DB fallback already correct).
- Filtering, sorting, pagination, and faceting behavior.

**Note:** The expected correct behavior for buggy inputs is defined in Property 1 below.

## Hypothesized Root Cause

Based on the code, the most likely issues are, in order of confidence:

1. **No scheduled trigger drains the queue (primary root cause)**:
   - `vercel.json` declares a single cron (`/api/cron/daily-blog`); there is no cron for the
     search index.
   - `processSearchIndexJobs()` exists but is not referenced by any route or scheduler.
   - The `search-index-worker` Edge Function exists but has no pg_cron schedule and no Vercel
     cron invoking it.
   - `/api/search/reindex` only upserts a `healthcheck` document — it is not a real reindex.
   - Result: `upsert` jobs for new/approved vehicles stay `pending` forever; Typesense is
     never updated.

2. **Pre-existing eligible vehicles missing from the index**: Vehicles approved before the
   fix (or whose jobs were lost/cleared) have no live mechanism to be (re)indexed even once a
   scheduler is added, unless a reconciliation/backfill enqueues `upsert` jobs for them.

3. **Failed jobs never retried in the Node path**: `processSearchIndexJobs()` only reads
   `status = pending`; transient Typesense errors mark jobs `failed` and they are never
   retried by that path (only the Edge Function handles `attempts`/`next_run_at` backoff).
   This can leave eligible vehicles unindexed even with a scheduler present.

4. **Authoritative-source assumption**: When Typesense is configured, the index is treated as
   the single source of truth with no staleness reconciliation, so an unprocessed queue
   silently produces invisible-but-saved vehicles with no error surfaced (Requirement 1.4).

## Correctness Properties

Property 1: Bug Condition - Newly Listed/Approved Vehicles Become Discoverable

_For any_ vehicle `X` where the bug condition holds (`isBugCondition(X)` returns true — `X` is
publicly eligible but absent from the Typesense-backed listing surfaces), the fixed system
SHALL, within a bounded and predictable time, process the queued index work so that `X`
appears in search by its location, in its category browsed with its location filter applied,
and on listing surfaces after a refresh.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Unaffected Inputs Behave Identically

_For any_ input where the bug condition does NOT hold (`isBugCondition(X)` returns false —
already-indexed vehicles, non-eligible vehicles, filtered/sorted queries, removed/suspended
vehicles, and the Typesense-unconfigured fallback), the fixed system SHALL produce exactly the
same result as the original system, preserving all existing search, filtering, sorting,
exclusion, and image/vendor/pricing resolution behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct, the fix has three parts: (1) schedule a drain of
the queue, (2) make the Node drainer recover transient failures, and (3) reconcile/backfill
already-eligible-but-unindexed vehicles. The smallest change reuses the existing, tested
`processSearchIndexJobs()` from a Vercel cron, mirroring the proven `daily-blog` cron pattern.

**File**: `src/app/api/cron/search-index/route.ts` (new)

**Behavior**:
1. **Authenticated cron endpoint**: A `GET` handler guarded by `CRON_SECRET` exactly like
   `src/app/api/cron/daily-blog/route.ts` (`Authorization: Bearer <CRON_SECRET>`), with
   `export const dynamic = "force-dynamic"` and an appropriate `maxDuration`.
2. **Drain the queue**: Call `processSearchIndexJobs(limit)` (looping until no pending jobs
   remain or a per-invocation cap is hit) and return `{ processed, errors }` as JSON.
   - Per AGENTS.md, confirm the Route Handler conventions in
     `node_modules/next/dist/docs/` before writing the handler (this Next.js is modified).

**File**: `vercel.json`

**Change**:
3. **Add a frequent cron entry** for `/api/cron/search-index` (e.g. `*/2 * * * *` or the
   smallest interval the deployment plan allows) alongside the existing `daily-blog` cron, so
   the queue drains within a bounded, predictable time (satisfies Requirement 2.4). Document
   the plan-dependent cron granularity.

**File**: `src/lib/search/typesense.ts`

**Change**:
4. **Recover transient failures in the Node drainer**: Extend `processSearchIndexJobs()` to
   also pick up retriable `failed` jobs (`attempts < 3` and `next_run_at <= now`) using the
   same backoff bookkeeping the Edge Function already implements, OR have the cron route invoke
   the existing `search-index-worker` Edge Function (which already has retry/backoff). Keep the
   chosen mechanism single-sourced to avoid double-processing.

**File**: backfill — a one-off script under `scripts/` (e.g. `scripts/reconcile-search-index.ts`),
mirroring existing maintenance scripts.

**Change**:
5. **Reconcile/backfill**: Enqueue `upsert` jobs for every currently approved vehicle (approved
   org + approved branch) so the existing invisible-but-saved vehicles (the reported Corvette)
   become discoverable once the scheduler runs. This closes the gap for vehicles whose jobs
   predate the fix or were lost. The enqueue is idempotent because the worker upserts by
   vehicle id.

**Explicitly NOT changed**: `searchVehicles()` query/filter/sort logic, the DB fallback, all
write-path enqueue logic, the Typesense schema, and image/vendor/pricing resolution.

## Testing Strategy

### Validation Approach

Two phases: first surface counterexamples that demonstrate the bug on the unfixed system
(eligible vehicle enqueued but never appearing in `searchVehicles`), then verify the fix makes
such vehicles discoverable within a bounded time while leaving every non-buggy input untouched.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix, and
confirm the root cause (queue never drained). If refuted, re-hypothesize.

**Test Plan**: With Typesense configured (or a stubbed Typesense client), simulate the full
listing flow: create/approve an eligible vehicle (which enqueues a `pending` `upsert` job),
then query `searchVehicles` for its city and city+category without running any drainer. Assert
the vehicle is absent and the job remains `pending`. Run against the UNFIXED code.

**Test Cases**:
1. **Location search after listing**: Approve a Sydney vehicle, then `searchVehicles("", { city: "Sydney" })` returns no such vehicle (will fail to find it on unfixed code).
2. **Category + location browse**: Approve a Luxury/Sydney vehicle, then `searchVehicles("", { city: "Sydney", category: "Luxury" })` excludes it (will fail on unfixed code).
3. **Queue inspection**: After listing, assert `search_index_jobs` has a `pending` `upsert` row that is never transitioned to `complete` (confirms drain never runs).
4. **Admin approval path**: Approve a pending vehicle via the moderation action; assert it stays absent from search (will fail on unfixed code).

**Expected Counterexamples**:
- Eligible vehicle present in DB and enqueued, but not returned by `searchVehicles`.
- Its `search_index_jobs` row stays `pending` indefinitely.
- Confirms cause: no scheduled processor invokes `processSearchIndexJobs()` / the Edge Function.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system makes the
vehicle discoverable.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  runSearchIndexCron()                       // drains pending (and retriable failed) jobs
  ASSERT appearsInSearchByLocation(X, X.city)
  ASSERT appearsInCategoryWithLocationFilter(X, X.category, X.city)
  ASSERT appearsOnListingSurfacesAfterRefresh(X)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system
produces the same result as the original system.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT searchResults_original(X) = searchResults_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation because:
- It generates many vehicle/filter combinations across the input domain automatically.
- It catches edge cases (mixed statuses, all filter permutations, Typesense-off fallback).
- It gives strong assurance that filtering, sorting, exclusion, and resolution are unchanged.

**Test Plan**: Capture `searchVehicles` results (and exclusions) for already-indexed vehicles,
non-eligible vehicles, and the Typesense-unconfigured fallback on the UNFIXED code, then assert
identical results after the fix.

**Test Cases**:
1. **Already-indexed vehicles**: Observe search/filter/sort results before the fix; assert identical after.
2. **Non-eligible exclusion**: Observe that pending/suspended/rejected vehicles and those under non-approved orgs/branches are excluded; assert still excluded after the fix.
3. **Filter integrity**: Observe results for location/category/price/seats/transmission/fuel filters; assert identical after the fix.
4. **Removal/suspension**: Observe that a removed/suspended vehicle's `delete` job drops it from surfaces; assert preserved after the fix.
5. **Typesense-off fallback**: Observe DB fallback results when Typesense is unconfigured; assert identical after the fix.

### Unit Tests

- `processSearchIndexJobs()` transitions a `pending` `upsert` job to `complete` and upserts the Typesense document for an eligible vehicle.
- `processSearchIndexJobs()` honors `delete` jobs and skips/deletes non-approved vehicles.
- Retriable `failed` jobs (`attempts < 3`, `next_run_at <= now`) are picked up; permanently failed jobs (`attempts >= 3`) are not.
- The cron route returns 401 without a valid `CRON_SECRET` bearer token and 200 with it.

### Property-Based Tests

- Generate random eligible vehicles; after running the drain, assert each appears in search by its city and city+category (Property 1).
- Generate random mixes of eligible/non-eligible vehicles and random filter sets; assert post-fix `searchVehicles` output equals pre-fix output for all non-buggy inputs (Property 2).
- Generate random queue states (mix of pending/complete/failed/delete jobs) and assert draining is idempotent and never indexes a non-approved vehicle.

### Integration Tests

- Full flow: list/approve a vehicle → run the search-index cron → vehicle is discoverable by location search and category+location browse and persists after a simulated refresh.
- Backfill flow: seed approved-but-unindexed vehicles, run the reconciliation backfill + cron, assert all become discoverable.
- Lifecycle: approve → reindex → visible; suspend/delete → reindex → no longer visible (confirms `delete` jobs still drop vehicles, Requirement 3.4).
