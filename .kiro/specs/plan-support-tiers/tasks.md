# Implementation Plan: Plan Support Tiers

## Overview

This plan implements three changes: reducing Starter vehicle limit (10 → 5) with auto-archival, introducing differentiated support tiers with per-plan channel routing, and removing GPS Verified badge from all surfaces. The approach is data-driven — updating plan configuration, adding a support routing module, writing a migration script, and removing GPS code paths across ~6 files.

## Tasks

- [x] 1. Update plan-features module and create support-channels module
  - [x] 1.1 Remove `gpsVerified` from PlanFeature type and FEATURES_BY_PLAN in `src/lib/plan-features.ts`
    - Remove `"gpsVerified"` from the `PlanFeature` union type
    - Remove `"gpsVerified"` from `FEATURES_BY_PLAN.growth` and `FEATURES_BY_PLAN.pro` arrays
    - Update `getSupportTierLabel()` to return new tier-specific labels: starter → "Email support", growth → "Priority email + Phone support", pro → "Dedicated Phone, Priority Email, Account Manager, Same-Day Response"
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Create `src/lib/support-channels.ts` with `getSupportConfig()` and `getSupportTierLabel()`
    - Define `SupportChannel` type and `SupportConfig` interface
    - Implement `SUPPORT_BY_PLAN` mapping: starter → `["email"]`, growth → `["priorityEmail", "phone"]`, pro → `["priorityEmail", "dedicatedPhone", "accountManager", "sameDayResponse"]`
    - Implement `getSupportConfig(planCode, subscriptionStatus?)` with fallback to starter for null/inactive subs
    - Implement `getSupportTierLabel(planCode)` helper
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 9.4_

  - [ ]* 1.3 Write property test: GPS feature exclusion (Property 5)
    - **Property 5: GPS feature is excluded from all plan feature sets**
    - Use fast-check to generate arbitrary valid plan codes and verify `planHasFeature(planCode, "gpsVerified")` is always false / type error
    - **Validates: Requirements 5.2, 7.1, 7.2**

  - [ ]* 1.4 Write property test: Support channel routing (Property 3)
    - **Property 3: Support channel routing maps each plan to the correct channels**
    - Use fast-check to generate plan codes and subscription statuses, verify `getSupportConfig` returns correct channels per plan and defaults to starter for inactive/null
    - **Validates: Requirements 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4**

  - [ ]* 1.5 Write property test: Support tier labels are distinct and correct (Property 4)
    - **Property 4: Support tier labels are distinct per plan and correctly mapped**
    - Use fast-check to verify `getSupportTierLabel` returns expected labels per plan and all labels are distinct across plans
    - **Validates: Requirements 2.3, 3.3, 4.5, 8.1**

- [x] 2. Create Support Router UI component
  - [x] 2.1 Create `src/components/vendor/support-router.tsx`
    - Import `getSupportConfig` from `src/lib/support-channels.ts`
    - Render appropriate contact cards per channel (email, phone, dedicated phone, account manager, same-day response)
    - Accept `planCode` and `subscriptionStatus` props
    - Use Lucide icons (Mail, Phone, UserCircle, Zap) and Tailwind styling
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.5, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create migration script and update vehicle limit
  - [x] 4.1 Create `scripts/archive-excess-starter-vehicles.mjs`
    - Query organizations on starter plan with active vehicle count > 5
    - For each, sort vehicles by `updated_at DESC`, archive all beyond first 5 (set `status = 'archived'`)
    - Log actions to `audit_logs` table
    - Export `selectVehiclesToArchive(vehicles, limit)` pure function for testability
    - _Requirements: 1.3_

  - [x] 4.2 Create Supabase migration to update `plans` table: starter `vehicle_limit` from 10 → 5
    - Create SQL migration file in `supabase/migrations/` updating the starter row
    - _Requirements: 1.1, 1.4, 1.5_

  - [ ]* 4.3 Write property test: Vehicle limit enforcement (Property 1)
    - **Property 1: Vehicle limit enforcement is consistent with plan configuration**
    - Use fast-check to generate plan codes and vehicle counts, verify enforcement allows add iff `currentCount < planLimit` (5 for starter, 20 for growth, 50 for pro)
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 4.4 Write property test: Archival selection retains most recent vehicles (Property 2)
    - **Property 2: Archival selection retains the most recently updated vehicles**
    - Use fast-check to generate lists of vehicles with distinct timestamps and limits, verify `selectVehiclesToArchive` returns exactly `(list.length - N)` IDs and none belong to the N most recent
    - **Validates: Requirements 1.3**

- [x] 5. Update Pricing Page
  - [x] 5.1 Update `src/app/(public)/pricing/pricing-content.tsx`
    - Change Starter plan `vehicles` from 10 → 5 and `features.listings` from `"10 vehicles"` → `"5 vehicles"`
    - Remove any GPS Verified badge references from feature lists (if present)
    - Update `features.support` values: starter → `"Email"`, growth → `"Priority email + Phone"`, pro → `"Dedicated Phone, Priority Email, Account Manager, Same-Day Response"`
    - _Requirements: 1.4, 2.3, 3.3, 4.5, 5.2, 8.1_

  - [x] 5.2 Update `src/components/pricing-table.tsx` (if exists) or the comparison table section
    - Add/update support tier row in comparison table with new labels per plan
    - Remove GPS row if present
    - _Requirements: 5.2, 8.1_

- [x] 6. Update Billing Page
  - [x] 6.1 Update `src/app/vendor/billing/page.tsx`
    - Change Starter `vehicles` from 10 → 5 in local `PLANS` constant
    - Update feature arrays: Starter `"10 vehicle listings"` → `"5 vehicle listings"`, remove `"GPS Verified badge"` from Growth features
    - Add support tier label to each plan's features using `getSupportTierLabel()` or inline labels
    - Update `!hasActiveSub` banner text: "list up to 10 vehicles" → "list up to 5 vehicles"
    - _Requirements: 1.5, 2.4, 3.4, 4.6, 5.2 (billing), 6.1, 8.2_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Remove GPS from Admin Panel and Public Vehicle Page
  - [x] 8.1 Remove GPS from admin vendor pages (`src/app/admin/vendors/`)
    - Remove `toggleGpsVerified` server action
    - Remove `gps_verified` from vendor query select
    - Remove GPS toggle button from `AdminVendorsTable`
    - Remove `gps_verified` field from `VendorRow` interface
    - _Requirements: 6.2, 6.3_

  - [x] 8.2 Remove GPS from public vehicle page (`src/app/(public)/cars/[slug]/page.tsx`)
    - Remove `gps_verified` from organizations select query
    - Remove `showGpsBadge` logic and GPS badge rendering
    - _Requirements: 5.1, 5.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration script (4.1) should be run once in production after the DB migration (4.2) is applied
- GPS column `gps_verified` in `organizations` table is retained for data purposes but no longer queried or displayed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "2.1"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "6.1"] },
    { "id": 4, "tasks": ["8.1", "8.2"] }
  ]
}
```
