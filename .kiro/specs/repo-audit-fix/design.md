# Technical Design Document — Repository Audit & Fix Plan
## Batch 2: Auth & Access Control Fixes (AUTH-003 through AUTH-008)

## Overview

This document provides the technical design for fixing authentication and access control issues identified in the Carhire repository audit. Batch 2 focuses on six specific authentication and access control issues that need to be addressed to ensure proper security, user management, and authorization flows.

**Batch Focus:** Authentication & Access Control
**Fix IDs:** AUTH-003 through AUTH-008
**Status:** Following Batch 1 (Critical Security Fixes) completion

---

## Architecture

### Current Auth Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Client   │────▶│   Middleware    │────▶│  Next.js App    │
│    (Browser)    │     │ (Session Refresh│     │    Router       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Supabase     │     │  Server Actions │     │   API Routes    │
│   Auth Service  │     │ (Auth checks)   │     │ (Auth checks)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     RLS         │     │ Admin Client    │     │   Supabase      │
│  Enforcement    │     │ (Service Role)  │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Authorization Flow Issues
1. **Server Actions** → `createAdminClient()` without proper ownership verification (AUTH-003)
2. **Admin Access** → Stale MFA metadata check (AUTH-004) 
3. **OAuth Flows** → Silent failure handling (AUTH-005)
4. **Vendor Onboarding** → Missing redirect guard (AUTH-006)
5. **RPC Error Handling** → Unhandled database errors (AUTH-007)
6. **Moderation Actions** → GET-based CSRF vulnerabilities (AUTH-008)

---

## Components and Interfaces

### 1. Authentication Components
- **`src/lib/security/auth.ts`** - Core authentication utilities
  - `requireUser()` - Basic user authentication
  - `requireAdmin()` - Admin authentication with MFA
  - `userHasMfa()` - MFA status checker (buggy)
  - `userHasPlatformRole()` - Role checker

- **`src/app/auth/callback/route.ts`** - OAuth callback handler
  - Handles Supabase OAuth exchange
  - Has silent failure and open redirect issues

- **`src/app/vendor/layout.tsx`** - Vendor route protection
  - Missing organization membership guard

### 2. Server Action Components (AUTH-003 Scope)
- **`src/app/vendor/onboarding/actions.ts`** - Vendor onboarding
- **`src/app/vendor/vehicles/actions.ts`** - Vehicle management
- **`src/app/vendor/vehicles/image-actions.ts`** - Image handling
- **`src/app/vendor/leads/actions.ts`** - Lead management  
- **`src/app/vendor/branches/actions.ts`** - Branch management

### 3. Moderation Components
- **`src/app/api/admin/moderation/route.ts`** - Secure moderation API
- **`src/app/admin/page.tsx`** - Admin dashboard with insecure links
- **`src/app/actions/chat.ts`** - Chat actions with RPC error handling

---

## Data Models

### Authentication Metadata
```typescript
// Current problematic metadata structure
type SupabaseUser = {
  id: string;
  app_metadata?: {
    platform_role?: string;  // "owner" | "admin" | "moderator"
    aal?: string;           // Stale: "aal1" | "aal2" (AUTH-004 issue)
    amr?: string[];         // Stale: MFA methods
  };
  factors?: unknown[];
};

// Live MFA status from Supabase
type AuthenticatorAssuranceLevel = {
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
};
```

### Organization Membership Model
```typescript
// Used for ownership verification (AUTH-003)
type OrganizationMembership = {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
};

// Vendor ownership verification pattern
async function ensureUserCanManageOrganization(
  userId: string, 
  organizationId: string
): Promise<void> {
  // Must be called BEFORE createAdminClient()
}
```

---

## Technical Approach for Each Batch 2 Fix

### AUTH-003: Server-Side Auth Check on Vendor API Routes

**Issue:** Vendor Server Actions call `createAdminClient()` (service role) without first verifying the user owns the organization ID being accessed.

**Root Cause:** Service-role client bypasses RLS, allowing potential privilege escalation if ownership checks are missing or incomplete.

**Files Affected:**
- `src/app/vendor/onboarding/actions.ts` - ✓ Already has `requireUser()` but onboarding creates new org
- `src/app/vendor/vehicles/actions.ts` - ✓ Already has `ensureUserCanManageOrganization()`
- `src/app/vendor/vehicles/image-actions.ts` - Need to verify
- `src/app/vendor/leads/actions.ts` - Need to verify  
- `src/app/vendor/branches/actions.ts` - ✓ Already has `ensureUserCanManageOrganization()`

**Implementation:**
1. Audit each vendor Server Action for proper ownership verification
2. Ensure `ensureUserCanManageOrganization()` is called BEFORE `createAdminClient()`
3. For onboarding: create new org, so ownership check not needed (user becomes owner)
4. Add missing ownership checks where needed

**Validation:** After fix, no vendor Server Action should call `createAdminClient()` without prior ownership verification.

---

### AUTH-004: Fix `userHasMfa` Function or Remove It

**Issue:** `requireAdmin()` uses live MFA check via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` but `userHasMfa()` helper reads stale `app_metadata.aal`.

**Root Cause:** Supabase stores MFA status in `app_metadata` but this can become stale; live session check is authoritative.

**Current Implementation:**
```typescript
// Buggy helper (reads stale metadata)
export function userHasMfa(user: SupabaseUser) {
  const aal = user.app_metadata?.aal;
  const amr = user.app_metadata?.amr;
  return aal === "aal2" || (Array.isArray(amr) && amr.includes("mfa"));
}

// Correct check (already in requireAdmin)
const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
const hasMfa = data?.currentLevel === 'aal2';
```

**Options:**
1. **Option A:** Fix `userHasMfa()` to use live check (requires Supabase client)
2. **Option B:** Remove `userHasMfa()` entirely (only used in `requireAdmin()` which already has correct check)
3. **Option C:** Deprecate `userHasMfa()` and update callers to use live check

**Recommendation:** Option B - Remove `userHasMfa()` function entirely since:
- Only used internally in `requireAdmin()`
- `requireAdmin()` already uses correct live check
- Removing eliminates confusion and stale data risk

---

### AUTH-005: Handle OAuth Exchange Errors in Auth Callback

**Issue:** `supabase.auth.exchangeCodeForSession(code)` errors are silently swallowed, redirecting users even when OAuth fails.

**Current Code:**
```typescript
if (code) {
  const supabase = await createClient();
  const { data } = await supabase.auth.exchangeCodeForSession(code);
  
  // NO ERROR CHECKING! If exchange fails, data.user is undefined
  if (data.user) {
    // Create profile...
  }
}
// Always redirects, even on auth failure
```

**Fix:**
```typescript
if (code) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    console.error('OAuth exchange failed:', error);
    return NextResponse.redirect(new URL('/auth/sign-in?error=auth_failed', requestUrl.origin));
  }
  
  if (data.user) {
    // Create profile...
  }
}
```

**Implementation:**
1. Add proper error handling for `exchangeCodeForSession()`
2. Redirect to sign-in with error parameter on failure
3. Log error for debugging

**Security Impact:** Prevents creation of broken sessions and provides user feedback on auth failures.

---

### AUTH-006: Add Redirect to Onboarding When Org Missing in Vendor Layout

**Issue:** Vendor layout authenticates user but doesn't check if user has an organization, leading to broken dashboard for new vendors.

**Current Code:**
```typescript
export default async function VendorLayout({ children }: { children: ReactNode }) {
  await requireUser(); // Only checks authentication
  return <DashboardShell mode="vendor">{children}</DashboardShell>;
}
```

**Problem:** New vendors complete OAuth but have no organization yet. They should be redirected to `/vendor/onboarding`.

**Fix Requirements:**
1. Check if authenticated user has organization membership
2. If no membership, redirect to onboarding
3. Preserve current functionality for existing vendors

**Implementation:**
```typescript
export default async function VendorLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  
  // Check for organization membership
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);
  
  // If no organization, redirect to onboarding
  if (!memberships || memberships.length === 0) {
    redirect('/vendor/onboarding');
  }
  
  return <DashboardShell mode="vendor">{children}</DashboardShell>;
}
```

**UX Impact:** Smooth onboarding flow instead of broken dashboard for new vendors.

---

### AUTH-007: Handle RPC Errors in `chat.ts` `sendMessage`

**Issue:** RPC call `supabase.rpc("is_org_member", ...)` in chat action lacks error handling, potentially causing null dereference.

**Current Code:**
```typescript
const { data: isVendorMember } = await supabase.rpc("is_org_member", {
  target_organization_id: lead.vendor_id
});

if (!isCustomer && !isVendorMember) {
  return { error: "Unauthorized to send messages for this lead" };
}
```

**Problem:** If RPC fails (network error, function missing, permission denied), `isVendorMember` could be `null` or `undefined`, leading to incorrect authorization decisions.

**Fix:**
```typescript
const { data: isVendorMember, error: rpcError } = await supabase.rpc("is_org_member", {
  target_organization_id: lead.vendor_id
});

// Handle RPC failure - treat as not a member
if (rpcError) {
  console.error('RPC is_org_member failed:', rpcError);
  // On RPC failure, user is not authorized
  if (!isCustomer) {
    return { error: "Unauthorized to send messages for this lead" };
  }
}

if (!isCustomer && !isVendorMember) {
  return { error: "Unauthorized to send messages for this lead" };
}
```

**Alternative Approach:** Use direct SQL query instead of RPC for more reliable membership check.

**Security Principle:** Fail securely - on error, assume least privilege.

---

### AUTH-008: Replace GET Moderation Links with Server Action Calls

**Issue:** Admin dashboard uses GET links with query parameters for moderation actions (`?approve=...`, `?reject=...`), vulnerable to CSRF attacks.

**Current Vulnerable Pattern:**
```typescript
<Link
  href={`/admin/vendors?approve=${vendor.id}`}
  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
>
  Approve
</Link>
```

**Problem:** Any website can embed `<img src="/admin/vendors?approve=123">` and trigger moderation if admin is logged in.

**Secure Pattern:** Use Server Actions with proper CSRF protection via Next.js.

**Implementation Plan:**
1. Create moderation Server Actions in `src/app/actions/admin.ts`:
   ```typescript
   "use server";
   
   export async function moderateResource(
     resourceType: 'vendor' | 'listing' | 'review',
     resourceId: string,
     action: 'approve' | 'reject' | 'suspend'
   ) {
     // Call existing secure API route or implement logic
   }
   ```
2. Replace GET links with forms or button handlers calling Server Actions
3. Update admin pages to use new Server Actions

**Files to Modify:**
- `src/app/admin/page.tsx` - Dashboard quick actions
- `src/app/admin/vendors/page.tsx` - Vendor moderation
- `src/app/admin/listings/page.tsx` - Listing moderation  
- `src/app/admin/reviews/page.tsx` - Review moderation

**Alternative:** Use existing secure API route (`/api/admin/moderation`) via fetch with CSRF tokens.

**Recommendation:** Use Server Actions for simplicity and built-in CSRF protection.

---

## File Modifications Needed

### 1. `src/lib/security/auth.ts` (AUTH-004)
```diff
- export function userHasMfa(user: SupabaseUser) {
-   const aal = user.app_metadata?.aal;
-   const amr = user.app_metadata?.amr;
-   return aal === "aal2" || (Array.isArray(amr) && amr.includes("mfa"));
- }

// Remove function entirely - requireAdmin already uses correct live check
```

### 2. `src/app/auth/callback/route.ts` (AUTH-005)
```diff
if (code) {
  const supabase = await createClient();
-  const { data } = await supabase.auth.exchangeCodeForSession(code);
+  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
+  if (error) {
+    console.error('OAuth exchange failed:', error);
+    return NextResponse.redirect(new URL('/auth/sign-in?error=auth_failed', requestUrl.origin));
+  }
  
  if (data.user) {
    // ... existing profile creation code
  }
}
```

### 3. `src/app/vendor/layout.tsx` (AUTH-006)
```diff
export default async function VendorLayout({ children }: { children: ReactNode }) {
-  await requireUser();
+  const user = await requireUser();
+  const supabase = await createClient();
+  
+  // Check for organization membership
+  const { data: memberships } = await supabase
+    .from('organization_members')
+    .select('organization_id')
+    .eq('user_id', user.id)
+    .limit(1);
+  
+  // If no organization, redirect to onboarding
+  if (!memberships || memberships.length === 0) {
+    redirect('/vendor/onboarding');
+  }

  return <DashboardShell mode="vendor">{children}</DashboardShell>;
}
```

### 4. `src/app/actions/chat.ts` (AUTH-007)
```diff
// Check if they are a vendor member
- const { data: isVendorMember } = await supabase.rpc("is_org_member", {
+ const { data: isVendorMember, error: rpcError } = await supabase.rpc("is_org_member", {
   target_organization_id: lead.vendor_id
 });

+// Handle RPC failure - treat as not a member
+if (rpcError) {
+  console.error('RPC is_org_member failed:', rpcError);
+  // On RPC failure, user is not authorized unless they are the customer
+  if (!isCustomer) {
+    return { error: "Unauthorized to send messages for this lead" };
+  }
+}

if (!isCustomer && !isVendorMember) {
  return { error: "Unauthorized to send messages for this lead" };
}
```

### 5. Create `src/app/actions/admin.ts` (AUTH-008)
```typescript
"use server";

import { requireAdmin } from "@/lib/security/auth";

export type ModerationActionResult = 
  | { success: true; message: string }
  | { success: false; error: string };

export async function moderateVendor(
  vendorId: string,
  action: 'approve' | 'reject' | 'suspend'
): Promise<ModerationActionResult> {
  await requireAdmin();
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'vendor',
        resourceId: vendorId,
        action,
        reason: `Moderated via Server Action`
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `Moderation failed: ${response.status}` };
    }
    
    return { success: true, message: `Vendor ${action}d successfully` };
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function moderateListing(
  listingId: string,
  action: 'approve' | 'reject' | 'suspend'
): Promise<ModerationActionResult> {
  await requireAdmin();
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'vehicle',
        resourceId: listingId,
        action,
        reason: `Moderated via Server Action`
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `Moderation failed: ${response.status}` };
    }
    
    return { success: true, message: `Listing ${action}d successfully` };
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function moderateReview(
  reviewId: string,
  action: 'approve' | 'reject'
): Promise<ModerationActionResult> {
  await requireAdmin();
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'review',
        resourceId: reviewId,
        action,
        reason: `Moderated via Server Action`
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `Moderation failed: ${response.status}` };
    }
    
    return { success: true, message: `Review ${action}d successfully` };
  } catch (error) {
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
```

### 6. Update `src/app/admin/page.tsx` (AUTH-008)
Replace GET links with Server Action calls (example for vendors):
```diff
- <Link
-   href={`/admin/vendors?approve=${vendor.id}`}
-   className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
- >
-   Approve
- </Link>

+ <form action={async () => {
+   'use server';
+   const result = await moderateVendor(vendor.id, 'approve');
+   if (result.success) {
+     revalidatePath('/admin');
+     revalidatePath('/admin/vendors');
+   } else {
+     console.error('Moderation failed:', result.error);
+   }
+ }}>
+   <button
+     type="submit"
+     className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
+   >
+     Approve
+   </button>
+ </form>
```

### 7. Audit Vendor Server Actions (AUTH-003)
Check each file for proper ownership verification:
- `src/app/vendor/vehicles/image-actions.ts` - Add `ensureUserCanManageOrganization()` if missing
- `src/app/vendor/leads/actions.ts` - Add `ensureUserCanManageOrganization()` if missing
- Verify others already have proper checks

---

## Testing Strategy

### Unit Tests
1. **AUTH-004:** Test `requireAdmin()` with/without MFA
2. **AUTH-005:** Test OAuth callback error scenarios
3. **AUTH-006:** Test vendor layout redirect logic
4. **AUTH-007:** Test RPC error handling in chat
5. **AUTH-008:** Test moderation Server Actions

### Integration Tests
1. **End-to-End OAuth Flow:** Test successful and failed OAuth exchanges
2. **Vendor Onboarding:** Test redirect from vendor layout when no org
3. **Moderation Actions:** Test Server Action calls to moderation API

### Manual Testing Checklist
- [ ] New vendor sign-up → Redirects to onboarding
- [ ] Existing vendor → Goes to dashboard
- [ ] Admin without MFA → Redirects to sign-in
- [ ] OAuth failure → Shows error on sign-in page
- [ ] Chat RPC failure → Fails securely (no unauthorized access)
- [ ] Moderation links → Use Server Actions not GET URLs
- [ ] Vendor actions → All have ownership checks before admin client

---

## Rollback Plan

### Safe Rollback Options
1. **Individual Fix Rollback:** Each fix is independent; can revert individually
2. **File-level Backup:** Backup each file before modification
3. **Git Branch:** Work in feature branch `batch2-auth-fixes`

### Rollback Procedures
1. **AUTH-004 Rollback:** Restore `userHasMfa()` function if removed
2. **AUTH-005 Rollback:** Revert error handling in auth callback
3. **AUTH-006 Rollback:** Remove organization check from vendor layout
4. **AUTH-007 Rollback:** Remove RPC error handling in chat
5. **AUTH-008 Rollback:** Restore GET links in admin pages

### Risk Mitigation
- **Low Risk:** AUTH-004, AUTH-005, AUTH-007 (non-breaking, additive)
- **Medium Risk:** AUTH-006 (changes user flow for new vendors)
- **High Risk:** AUTH-008 (changes UI interaction pattern)

### Monitoring After Deployment
1. Check auth logs for OAuth failures
2. Monitor new vendor onboarding success rate
3. Verify admin moderation actions work correctly
4. Watch for chat authorization errors

---

## Dependencies and Constraints

### Dependencies
1. **Batch 1 Completion:** Requires Batch 1 critical fixes to be deployed first
2. **Supabase:** Relies on Supabase auth and database services
3. **Next.js:** Uses Server Actions feature (requires Next.js 14+)

### Constraints
1. **Backward Compatibility:** Must not break existing authenticated sessions
2. **Performance:** Organization check in vendor layout adds database query
3. **User Experience:** AUTH-006 changes flow for new vendors (improvement)

### Assumptions
1. Supabase RPC `is_org_member` exists and works when called correctly
2. Admin users have MFA enabled (enforced by `requireAdmin()`)
3. Batch 1 fixes are already deployed and working

---

## Success Criteria

### Technical Success
- [ ] All vendor Server Actions verify ownership before `createAdminClient()`
- [ ] `userHasMfa()` function removed or fixed
- [ ] OAuth errors properly handled and redirected
- [ ] New vendors redirected to onboarding
- [ ] RPC errors in chat handled securely
- [ ] Moderation actions use Server Actions not GET links

### Security Success  
- [ ] No service-role client calls without ownership verification
- [ ] No stale MFA metadata used for authorization
- [ ] No silent OAuth failures
- [ ] No CSRF-vulnerable GET moderation links
- [ ] Fail-secure error handling for RPC calls

### User Experience Success
- [ ] New vendors smoothly redirected to onboarding
- [ ] OAuth failures show clear error messages
- [ ] Moderation actions work with proper feedback
- [ ] No broken dashboard for incomplete onboarding

---

## Next Steps

### Implementation Order
1. **Phase 1:** AUTH-004, AUTH-005, AUTH-007 (non-breaking fixes)
2. **Phase 2:** AUTH-006, AUTH-003 (user flow changes, audits)
3. **Phase 3:** AUTH-008 (UI pattern changes)

### Validation Checklist
- [ ] Code review completed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Security review passed
- [ ] Deployment to staging
- [ ] Monitoring established

### Post-Implementation Tasks
1. Update documentation for new vendor onboarding flow
2. Add monitoring for auth callback errors
3. Create admin training for new moderation UI
4. Schedule Batch 3 (API & Backend Correctness) planning

---

*This design document covers Batch 2: Auth & Access Control fixes. Batch 3 will address API & Backend Correctness issues.*


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Note on PBT Applicability:** For this Batch 2 (Auth & Access Control), property-based testing IS applicable for the authentication logic components (AUTH-004, AUTH-005, AUTH-006, AUTH-007) but NOT for the code structure/UI pattern fixes (AUTH-003, AUTH-008), which require integration tests and code review.

### Property 1: Live MFA Enforcement

*For any* user authentication check requiring MFA, the system SHALL use the live session's authenticator assurance level from `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` rather than stale `app_metadata` fields, ensuring MFA status is always current and accurate.

**Validates: Requirements 3.2 (AUTH-004)**

### Property 2: OAuth Error Handling

*For any* OAuth code exchange that returns an error in the auth callback, the system SHALL redirect the user to `/auth/sign-in?error=auth_failed` with an appropriate HTTP status, rather than silently continuing with a broken session or redirecting to the target page.

**Validates: Requirements 3.3 (AUTH-005)**

### Property 3: Onboarding Redirection

*For any* authenticated user accessing vendor routes without organization membership, the vendor layout SHALL redirect to `/vendor/onboarding` before rendering any vendor dashboard content, ensuring incomplete onboarding users complete the required steps.

**Validates: Requirements 3.4 (AUTH-006)**

### Property 4: Secure RPC Error Handling

*For any* RPC call failure during authorization checks (such as `is_org_member`), the system SHALL treat the failure as an authorization denial and return a secure error response, rather than throwing an unhandled exception or granting unintended access.

**Validates: Requirements 3.5 (AUTH-007)**

### Integration Test Requirements (Non-PBT)

#### Integration Test 1: Server Action Ownership Verification

WHEN reviewing any vendor Server Action (`onboarding/actions.ts`, `vehicles/actions.ts`, `image-actions.ts`, `leads/actions.ts`, `branches/actions.ts`) that calls `createAdminClient()`, the code SHALL first call `ensureUserCanManageOrganization()` or equivalent ownership verification, ensuring service-role database access is never exercised without proper authorization.

**Validates: Requirements 3.1 (AUTH-003)**

#### Integration Test 2: Moderation Action Security

WHEN examining admin dashboard moderation interfaces, all "Approve", "Reject", and "Suspend" actions SHALL be implemented as Server Action calls (or secure POST requests) rather than GET links with query parameters, preventing CSRF attacks and direct URL manipulation.

**Validates: Requirements 3.6 (AUTH-008)**

---

## Property Reflection

After analyzing the acceptance criteria, I identified the following property structure:

1. **Live MFA Enforcement** (AUTH-004) - Tests authentication logic using live session data
2. **OAuth Error Handling** (AUTH-005) - Tests error recovery in auth flows  
3. **Onboarding Redirection** (AUTH-006) - Tests user flow completeness
4. **Secure RPC Error Handling** (AUTH-007) - Tests fail-secure authorization

**Redundancy Analysis:**
- These four properties are distinct and non-overlapping:
  - MFA enforcement is about authentication method
  - OAuth error handling is about error recovery  
  - Onboarding redirection is about user flow
  - RPC error handling is about authorization failure modes
- Each property validates a unique security or correctness aspect
- No logical redundancy exists between them

**Consolidation Opportunities:**
- No properties can be combined as they test fundamentally different aspects of the system
- Each property provides unique validation value for its specific security concern

---

## Testing Strategy

### Dual Testing Approach

**Unit Tests** (Example-based):
- Test specific authentication scenarios
- Verify error messages and redirects
- Mock Supabase client responses
- Test edge cases for each fix

**Property-Based Tests** (Universal properties):
- Test Property 1: Generate random user states with varying metadata to verify live MFA check
- Test Property 2: Generate random OAuth exchange errors to verify proper error handling
- Test Property 3: Generate random user/organization states to verify onboarding redirection  
- Test Property 4: Generate random RPC failure modes to verify secure error handling

**Integration Tests**:
- Verify Server Actions have proper ownership checks (code review + static analysis)
- Verify moderation interfaces use secure Server Actions (UI testing + code review)

### Property Test Configuration

**Library:** Use `fast-check` for property-based testing (TypeScript compatible)

**Configuration:**
- Minimum 100 iterations per property test
- Maximum 1000 iterations for security-critical properties
- Tag format: `Feature: repo-audit-fix, Property {number}: {property_title}`

**Test Structure:**
```typescript
import * as fc from 'fast-check';

describe('Property 1: Live MFA Enforcement', () => {
  it('should use live MFA check not stale metadata', () => {
    fc.assert(
      fc.property(
        // Generator for random user states
        userArb,
        (user) => {
          // Test that requireAdmin() calls getAuthenticatorAssuranceLevel()
          // not user.app_metadata.aal
          return hasLiveMfaCheck(user);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Test Requirements

For non-PBT requirements (AUTH-003, AUTH-008):
- **Static Analysis Tests:** Scripts to verify code patterns
- **Manual Code Review:** Required for security-critical patterns  
- **UI Component Tests:** Verify button actions use Server Actions
- **Security Scanner:** Check for CSRF-vulnerable patterns

---

## Implementation Notes

### Property Test Implementation Priority
1. **Property 2 (OAuth Error Handling)** - Highest priority, prevents broken sessions
2. **Property 4 (RPC Error Handling)** - Security-critical, prevents auth bypass
3. **Property 1 (Live MFA Enforcement)** - Important for admin security
4. **Property 3 (Onboarding Redirection)** - User experience improvement

### Test Data Generation
Need to create generators for:
- User objects with various metadata states
- OAuth exchange error conditions  
- User/organization membership states
- RPC failure modes (network errors, database errors, null returns)

### Mock Strategy
Use dependency injection or test doubles for:
- Supabase auth client
- Database RPC functions  
- HTTP request/response objects
- Navigation/router functions