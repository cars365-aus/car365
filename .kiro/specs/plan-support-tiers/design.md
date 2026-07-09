# Design Document: Plan Support Tiers

## Overview

This feature modifies the existing plan-features module and associated UI components to:
1. Reduce Starter plan vehicle limit from 10 → 5 (with auto-archival migration)
2. Introduce differentiated support tiers with per-plan channel routing
3. Remove GPS Verified badge from all surfaces and clean up the feature flag

The changes are primarily data-driven: updating plan configuration constants, adding a new support routing module, and removing GPS-related code paths.

## Architecture

The system follows the existing pattern where plan configuration is centralized in `src/lib/plan-features.ts` and consumed by UI components. This feature adds a new `src/lib/support-channels.ts` module that owns support routing logic, keeping it decoupled from the feature-gating system. The GPS removal is a subtractive change across ~6 files, eliminating dead code paths.

Key architectural decisions:
- Support configuration is code-driven (no database table) since tiers are static per plan
- The `selectVehiclesToArchive` function is a pure utility for the migration script, testable in isolation
- GPS removal is type-driven: removing from the `PlanFeature` union causes compile-time errors at all usage sites

## Components and Interfaces

### 1. Plan Configuration Updates (`src/lib/plan-features.ts`)

**Changes:**
- Remove `"gpsVerified"` from the `PlanFeature` union type
- Remove `"gpsVerified"` from `FEATURES_BY_PLAN.growth` and `FEATURES_BY_PLAN.pro` arrays
- Update `getSupportTierLabel()` to return new tier-specific labels:
  - `starter` → `"Email support"`
  - `growth` → `"Priority email + Phone support"`
  - `pro` → `"Dedicated Phone, Priority Email, Account Manager, Same-Day Response"`

```typescript
export type PlanFeature =
  | "directContact"
  | "contactAnalytics"
  | "realtimeLeads"
  | "bulkUpload"
  | "featuredPlacement"
  | "aiSeoContent"
  | "apiAccess"
  | "prioritySupport";

const FEATURES_BY_PLAN: Record<PlanCode, PlanFeature[]> = {
  starter: [],
  growth: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
    "featuredPlacement",
  ],
  pro: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
    "bulkUpload",
    "featuredPlacement",
    "aiSeoContent",
    "apiAccess",
    "prioritySupport",
  ],
};
```

### 2. Support Channel Router (`src/lib/support-channels.ts` — new file)

A pure function module that maps plan codes to available support channels. This centralizes the support routing logic for both the UI component and any API needs.

```typescript
import type { PlanCode } from "@/lib/types";

export type SupportChannel = "email" | "priorityEmail" | "phone" | "dedicatedPhone" | "accountManager" | "sameDayResponse";

export interface SupportConfig {
  channels: SupportChannel[];
  label: string;
}

const SUPPORT_BY_PLAN: Record<PlanCode, SupportConfig> = {
  starter: {
    channels: ["email"],
    label: "Email support",
  },
  growth: {
    channels: ["priorityEmail", "phone"],
    label: "Priority email + Phone support",
  },
  pro: {
    channels: ["priorityEmail", "dedicatedPhone", "accountManager", "sameDayResponse"],
    label: "Dedicated Phone, Priority Email, Account Manager, Same-Day Response",
  },
};

export function getSupportConfig(planCode: string | null | undefined, subscriptionStatus?: string): SupportConfig {
  // Default to starter for inactive/missing subscriptions
  if (!planCode || (subscriptionStatus && !["active", "trialing"].includes(subscriptionStatus))) {
    return SUPPORT_BY_PLAN.starter;
  }
  return SUPPORT_BY_PLAN[planCode as PlanCode] ?? SUPPORT_BY_PLAN.starter;
}

export function getSupportTierLabel(planCode: string | null | undefined): string {
  return getSupportConfig(planCode).label;
}
```

### 3. Support Router UI Component (`src/components/vendor/support-router.tsx` — new file)

A server component that renders the appropriate support contact options based on the vendor's plan.

```typescript
import { getSupportConfig, type SupportChannel } from "@/lib/support-channels";
import { Mail, Phone, UserCircle, Zap } from "lucide-react";

interface SupportRouterProps {
  planCode: string | null | undefined;
  subscriptionStatus?: string;
}

export function SupportRouter({ planCode, subscriptionStatus }: SupportRouterProps) {
  const config = getSupportConfig(planCode, subscriptionStatus);

  return (
    <div className="space-y-3">
      {config.channels.map((channel) => (
        <SupportChannelCard key={channel} channel={channel} />
      ))}
    </div>
  );
}
```

### 4. Vehicle Limit Update (Database `plans` table)

Update the `vehicle_limit` column in the `plans` table for the `starter` row from 10 → 5.

### 5. Auto-Archive Migration Script (`scripts/archive-excess-starter-vehicles.mjs`)

A one-time script that:
1. Queries all organizations on `starter` plan with active vehicle count > 5
2. For each, sorts vehicles by `updated_at DESC`
3. Archives (sets `status = 'archived'`) all vehicles beyond the first 5
4. Logs actions to `audit_logs`

```typescript
export function selectVehiclesToArchive(
  vehicles: Array<{ id: string; updated_at: string }>,
  limit: number
): string[] {
  const sorted = [...vehicles].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  return sorted.slice(limit).map((v) => v.id);
}
```

### 6. Pricing Page Updates (`src/app/(public)/pricing/pricing-content.tsx` + `src/components/pricing-table.tsx`)

- Update Starter plan `vehicles` from 10 → 5 and `features.listings` from `"10 vehicles"` → `"5 vehicles"`
- Remove all GPS Verified badge references from feature lists
- Update `features.support` to use new tier labels
- Add support tier row to comparison table

### 7. Billing Page Updates (`src/app/vendor/billing/page.tsx`)

- Update local `PLANS` constant: Starter vehicles 10 → 5, remove GPS from Growth features
- Add support tier label to "Plan Includes" section using `getSupportTierLabel()`
- Remove all GPS references from feature arrays

### 8. Admin Panel GPS Removal (`src/app/admin/vendors/page.tsx` + `vendors-table.tsx`)

- Remove `toggleGpsVerified` server action
- Remove `gps_verified` from vendor query select
- Remove GPS toggle button from `AdminVendorsTable`
- Remove `gps_verified` field from `VendorRow` interface

### 9. Public Vehicle Page GPS Removal (`src/app/(public)/cars/[slug]/page.tsx`)

- Remove `gps_verified` from organizations select
- Remove `showGpsBadge` logic and GPS badge rendering

## Interfaces

### `getSupportConfig(planCode, subscriptionStatus?) → SupportConfig`

Pure function. Returns the support configuration (channels + label) for a given plan. Falls back to starter-level support if plan is null/undefined or subscription is not active/trialing.

### `selectVehiclesToArchive(vehicles, limit) → string[]`

Pure function. Given a list of vehicles with `id` and `updated_at`, returns the IDs of vehicles to archive (all beyond the `limit` most-recently-updated).

### `planHasFeature(planCode, feature) → boolean`

Existing function. After this change, `"gpsVerified"` will no longer be a valid `PlanFeature` value (TypeScript compile error if used).

## Data Models

### `plans` table (Supabase)

| Column | Change |
|--------|--------|
| `vehicle_limit` (row: starter) | 10 → 5 |

### `organizations` table (Supabase)

| Column | Change |
|--------|--------|
| `gps_verified` | Column remains for data retention but is no longer queried or displayed |

No new tables required. Support configuration is code-driven (no database storage needed).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Starter vendor attempts to add vehicle #6+ | Reject with clear upgrade message |
| Unknown plan code passed to `getSupportConfig` | Falls back to starter config (email only) |
| Inactive/expired subscription accessing support | Defaults to starter-level support |
| Migration script encounters DB error | Log error, skip vendor, continue processing remaining |
| TypeScript code references `gpsVerified` | Compile-time error (type removed) |

## Testing Strategy

**Property-based tests** (Vitest + fast-check, minimum 100 iterations each):
- Vehicle limit enforcement logic
- Archival selection algorithm
- Support channel routing
- Support tier label mapping
- GPS feature exclusion

**Example-based unit tests**:
- Pricing page renders "5 vehicles" for Starter
- Billing page shows correct support tier per plan
- GPS badge does not render on vehicle pages
- Admin table has no GPS toggle

**Smoke tests**:
- TypeScript compilation succeeds (verifies GPS type removal)
- Database migration applies without error

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vehicle limit enforcement is consistent with plan configuration

*For any* plan code and any current vehicle count, the enforcement function SHALL allow adding a vehicle if and only if `currentCount < planLimit`, where `planLimit` is 5 for starter, 20 for growth, 50 for pro, and null (unlimited) is always allowed.

**Validates: Requirements 1.1, 1.2**

### Property 2: Archival selection retains the most recently updated vehicles

*For any* list of vehicles with distinct `updated_at` timestamps and any positive limit N where the list length exceeds N, the `selectVehiclesToArchive` function SHALL return exactly `(list.length - N)` vehicle IDs, and none of those IDs SHALL belong to the N vehicles with the most recent `updated_at` values.

**Validates: Requirements 1.3**

### Property 3: Support channel routing maps each plan to the correct channels

*For any* valid plan code with an active or trialing subscription status, `getSupportConfig` SHALL return: only `["email"]` for starter, `["priorityEmail", "phone"]` for growth, and `["priorityEmail", "dedicatedPhone", "accountManager", "sameDayResponse"]` for pro. For any null/undefined plan code or non-active subscription status, it SHALL return the starter config.

**Validates: Requirements 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4**

### Property 4: Support tier labels are distinct per plan and correctly mapped

*For any* plan code, `getSupportTierLabel` SHALL return `"Email support"` for starter, `"Priority email + Phone support"` for growth, and `"Dedicated Phone, Priority Email, Account Manager, Same-Day Response"` for pro. Furthermore, for any two distinct valid plan codes, the returned labels SHALL be different.

**Validates: Requirements 2.3, 3.3, 4.5, 8.1**

### Property 5: GPS feature is excluded from all plan feature sets

*For any* valid plan code, the feature array returned by the plan-features system SHALL NOT contain `"gpsVerified"`. Equivalently, `planHasFeature(anyPlanCode, "gpsVerified")` SHALL always return false (and the type system SHALL prevent this call at compile time).

**Validates: Requirements 5.2, 7.1, 7.2**
