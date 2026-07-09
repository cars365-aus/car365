# Carhire Marketplace - Comprehensive Security & Architecture Assessment

**Date:** Thursday, May 28, 2026  
**Auditor:** Claude (AI Security Analysis)  
**Application:** Carhire - Car Rental Marketplace Platform  
**Stack:** Next.js 16.2.6, Supabase, Stripe, Typesense, Cloudflare Turnstile, Resend

---

## Executive Summary

The Carhire marketplace is a well-architected Next.js application with strong security foundations including comprehensive Row Level Security (RLS), admin privilege checks, audit logging, and fraud detection capabilities. However, the codebase is currently a **sophisticated scaffold with extensive mock/placeholder implementations** that require significant development before production readiness.

**Overall Assessment:**  
- **Security Foundation:** Strong (85/100)
- **Implementation Completeness:** Low (35/100)
- **Production Readiness:** Not Ready - Requires 4-6 weeks of development

---

## 1. Implementation Status

### Fully Implemented

| Component | Status | Details |
|-----------|--------|---------|
| Database Schema | Complete | Comprehensive migrations with RLS policies |
| Authentication | Complete | Google OAuth via Supabase, MFA enforcement for admins |
| Authorization | Complete | Multi-layer: RLS + app-level checks + admin roles |
| Lead Submission API | Complete | Rate-limited, Turnstile-protected, validated |
| Stripe Webhook | Complete | Idempotency, signature verification, event storage |
| Billing Checkout | Complete | Checkout session creation with metadata |
| Validation Layer | Complete | Zod schemas for all major inputs |
| Admin Moderation API | Scaffold | Structure present but doesn't update actual records |

### Partially Implemented / Placeholder

| Component | Status | Issues |
|-----------|--------|--------|
| **Vehicle CRUD** | Mock Only | Form present but no server actions for create/update/delete |
| **Search Functionality** | Mock Only | Uses static mock data, Typesense integration incomplete |
| **Public Pages** | Mock Data | All marketplace pages use `featuredVehicles` mock array |
| **Admin Dashboards** | Static Values | All metrics display "0" - no real data fetching |
| **Vendor Analytics** | Placeholder | Page exists but no implementation |
| **Email System** | Partial | Lead alerts use hardcoded `vendor@example.com` |
| **Contact Events API** | Complete | Functional but not wired to frontend forms |
| **Vehicle Images** | Schema Only | Storage policies exist, upload UI not implemented |
| **Billing Portal** | Complete | Functional but untested |
| **Review System** | Schema Only | No API or UI for submission/moderation |

### Not Implemented

| Component | Priority | Business Impact |
|-----------|----------|-----------------|
| Vehicle limit enforcement | Critical | Subscription tiers have limits but no enforcement |
| ABN validation (real-time) | High | Only regex validation, no ABN lookup API |
| Webhook event processing | Critical | Events stored but not acted upon (no subscription state updates) |
| Lead management workflow | High | No lead status transitions, assignment, or notifications |
| Image moderation | Medium | Storage policies exist but no approval workflow |
| Document verification | Medium | Vendor document upload UI missing |
| Featured placements | Low | Schema exists but no booking mechanism |
| Search index sync | Medium | Queue table exists but no worker implementation |

---

## 2. Strengths

### Security Architecture

1. **Comprehensive RLS Implementation**
   - All 22 tables have RLS enabled (`src/lib/supabase/admin.ts`)
   - Fine-grained policies using helper functions in `app_private` schema
   - Proper separation of public/vendor/admin access levels

2. **Multi-Layer Authorization**
   - `requireAdmin()` enforces both platform role AND MFA (`src/lib/security/auth.ts:46-58`)
   - `ensureUserCanManageOrganization()` validates membership + role (`src/lib/data/vendor.ts:80-96`)
   - App-level checks complement database policies

3. **Stripe Security**
   - Raw body preservation for signature verification (`src/app/api/stripe/webhook/route.ts:13-24`)
   - Idempotency via event ID deduplication (`src/app/api/stripe/webhook/route.ts:27-35`)
   - Service role key isolated to server-only code

4. **Rate Limiting & Abuse Prevention**
   - In-memory token bucket implementation (`src/lib/security/rate-limit.ts`)
   - IP-based limiting for leads (5/min) and contacts (30/min)
   - Cloudflare Turnstile integration with optional bypass for development

5. **Audit Trail**
   - Comprehensive `audit_logs` table with actor, action, resource tracking
   - `security_events` table for authentication/security incidents
   - `lead_events` for lead lifecycle tracking

6. **Input Validation**
   - Zod schemas for all API inputs (`src/lib/validation/schemas.ts`)
   - Strong TypeScript types throughout
   - Regex validation for ABN (11 digits)

### Architecture Decisions

1. **Separation of Concerns**
   - Clear boundaries: public marketplace vs vendor SaaS vs admin console
   - Service clients separated: `server.ts` (cookie-based) vs `admin.ts` (service key)

2. **Scalable Design Patterns**
   - Organization/branch hierarchy supports enterprise multi-location
   - Search index job queue for async processing
   - Subscription tier system with plan codes

3. **Compliance-Ready Structure**
   - `legal_acceptances` table for terms tracking
   - `fraud_flags` and `moderation_notes` for abuse handling
   - Runbooks for incident response

---

## 3. Loopholes, Pitfalls & Security Gaps

### Critical Issues

#### 1. Webhook Event Processing Gap
**Location:** `src/app/api/stripe/webhook/route.ts:44-51`  
**Severity:** Critical  
**Issue:** Webhook events are stored but NOT processed. The subscription state is never updated based on Stripe events.

```typescript
// Current code only stores events - no business logic
await supabase.from("subscription_events").insert({...});
return NextResponse.json({ received: true });
```

**Impact:** Vendors won't have active subscriptions even after successful payment.  
**Fix Required:**
```typescript
// Needed: Event processing logic
if (event.type === 'checkout.session.completed') {
  await supabase.from('subscriptions').upsert({...})
}
if (event.type === 'invoice.payment_failed') {
  await supabase.from('subscriptions').update({ status: 'past_due' })
}
```

#### 2. Missing Vehicle Limit Enforcement
**Location:** Vehicle creation actions (not implemented)  
**Severity:** Critical  
**Issue:** Subscription tiers define vehicle limits (5/25/100/300) but there's no enforcement mechanism.

**Attack Vector:** Vendor on Starter plan ($X/month) could create unlimited listings.  
**Fix Required:**
```typescript
// Before vehicle insert:
const currentCount = await getVehicleCount(organizationId);
const limit = await getPlanLimit(organizationId);
if (currentCount >= limit) {
  throw new Error('Vehicle limit reached for your plan');
}
```

#### 3. Hardcoded Email in Lead Alerts
**Location:** `src/app/api/leads/route.ts:51-55`  
**Severity:** High  
**Issue:** Lead notifications always go to `vendor@example.com` instead of the actual vendor.

```typescript
await sendLeadAlert({
  to: "vendor@example.com", // BUG: Should be fetched from organization
  vehicleTitle: "Vehicle listing", // BUG: Should be actual vehicle title
  customerName: payload.data.name,
});
```

**Impact:** Real leads would be lost; vendors never notified.  
**Fix Required:**
```typescript
const { data: org } = await supabase
  .from('organizations')
  .select('billing_email')
  .eq('id', payload.data.vendorId)
  .single();
```

### High Severity Issues

#### 4. ABN Validation Only Regex-Based
**Location:** `src/lib/validation/schemas.ts:3-7`  
**Severity:** High  
**Issue:** Only checks 11 digits, not actual ABN validity via checksum algorithm.

```typescript
export const abnSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "ABN must be 11 digits");
```

**Impact:** Fake ABNs can pass validation. Australian tax compliance risk.  
**Fix Required:** Implement weighted checksum validation per ATO specification.

#### 5. Race Condition in Concurrent Onboarding
**Location:** `src/app/vendor/onboarding/actions.ts:38-55`  
**Severity:** High  
**Issue:** No transaction wrapping for multi-table writes.

```typescript
// These are independent operations - partial failure possible
await supabase.from("organizations").insert({...})
await supabase.from("organization_members").insert({...})
await supabase.from("branches").insert({...})
```

**Attack Scenario:** Network interruption after organization creation but before membership = orphaned org, user locked out.  
**Fix Required:** Use database transactions or implement rollback logic.

#### 6. Missing Vehicle Existence Check on Lead Creation
**Location:** `src/app/api/leads/route.ts:29-45`  
**Severity:** High  
**Issue:** Lead accepts any `vehicleId` and `vendorId` without validating existence or relationship.

**Attack Vector:** Spammer could flood non-existent vehicles, pollute database.  
**Fix Required:**
```typescript
const { data: vehicle } = await supabase
  .from('vehicles')
  .select('id, organization_id, status')
  .eq('id', payload.data.vehicleId)
  .eq('organization_id', payload.data.vendorId)
  .eq('status', 'approved')
  .single();

if (!vehicle) {
  return NextResponse.json({ error: "Invalid vehicle" }, { status: 400 });
}
```

### Medium Severity Issues

#### 7. In-Memory Rate Limiting Not Distributed
**Location:** `src/lib/security/rate-limit.ts:6`  
**Severity:** Medium  
**Issue:** Rate limit state stored in process memory (`const buckets = new Map()`).

**Impact:** 
- Doesn't work across multiple serverless instances
- Resets on deployment
- Bypassable by distributing requests across regions

**Fix:** Use Redis or database-backed rate limiting for production.

#### 8. Missing Admin MFA Signal Validation
**Location:** `src/lib/security/auth.ts:39-44`  
**Severity:** Medium  
**Issue:** Relies on `app_metadata.aal` which may not reflect actual MFA state.

```typescript
export function userHasMfa(user: SupabaseUser) {
  const aal = user.app_metadata?.aal; // Could be stale
  return aal === "aal2" || (Array.isArray(amr) && amr.includes("mfa"));
}
```

**Fix:** Verify MFA status with Supabase Auth API before sensitive operations.

#### 9. No Input Sanitization for Search
**Location:** Search implementation (not fully built)  
**Severity:** Medium  
**Issue:** When search is implemented, direct Typesense queries could expose injection vulnerabilities.

**Recommendation:** Use parameterized queries; don't pass raw user input to Typesense filters.

#### 10. Turnstile Bypass in Development
**Location:** `src/lib/security/turnstile.ts:6-8`  
**Severity:** Low  
**Issue:** Returns `{ ok: true, skipped: true }` when secret not configured.

```typescript
if (!secret) {
  return { ok: true, skipped: true }; // Silent bypass
}
```

**Risk:** Developer might deploy without setting `TURNSTILE_SECRET_KEY`.  
**Fix:** Fail closed in production - require explicit `TURNSTILE_SKIP=true` for dev.

### Business Logic Gaps

#### 11. No Lead Expiration/TTL
**Location:** `supabase/migrations/20260527100000_initial_enterprise_marketplace.sql:131-146`  
**Severity:** Medium  
**Issue:** Leads table has no expiration date. Database will grow indefinitely.

#### 12. Missing Branch Capacity Management
**Severity:** Medium  
**Issue:** No tracking of branch capacity or concurrent rental limits.

#### 13. No Duplicate Lead Detection
**Severity:** Medium  
**Issue:** Same customer could submit identical leads repeatedly within rate limit window.

---

## 4. Critical Missing Pieces (Required Before Production)

### Must-Have (Block Launch)

| Feature | Effort | Description |
|---------|--------|-------------|
| **Stripe webhook processing** | 2-3 days | Actually update subscription state from events |
| **Vehicle limit enforcement** | 1-2 days | Check subscription tier before allowing vehicle creation |
| **Real vehicle CRUD** | 3-4 days | Server actions for create, update, delete with image handling |
| **Dynamic search** | 3-5 days | Replace mock data with real Typesense integration |
| **Lead notification fix** | 1 day | Send to actual vendor email, include real vehicle details |
| **Vehicle existence validation** | 1 day | Verify vehicle exists and is approved before lead creation |
| **Admin moderation actions** | 2 days | Actually update vendor/branch/vehicle status from admin panel |

### Should-Have (Launch Without, Add Soon)

| Feature | Effort | Description |
|---------|--------|-------------|
| **ABN checksum validation** | 1 day | Real ABN verification per ATO spec |
| **Distributed rate limiting** | 2-3 days | Redis-based rate limits |
| **Lead management UI** | 2-3 days | Vendor view, status transitions, notes |
| **Image upload & moderation** | 3-4 days | Storage integration, approval workflow |
| **Review system** | 2-3 days | Customer review submission, admin moderation |
| **Search index worker** | 2-3 days | Async Typesense indexing from queue |
| **Lead expiration** | 1 day | Auto-archive old leads |

### Nice-to-Have

| Feature | Effort | Description |
|---------|--------|-------------|
| **Real-time notifications** | 3-5 days | WebSocket or SSE for new leads |
| **Advanced analytics** | 3-5 days | Click tracking, conversion funnels |
| **Multi-factor auth for vendors** | 2-3 days | Optional MFA for vendor accounts |
| **API rate limiting dashboard** | 2-3 days | Admin view of rate limit hits |

---

## 5. Upgrade Recommendations

### Security Enhancements

1. **Implement Content Security Policy**
   ```typescript
   // Add to middleware or headers
   Content-Security-Policy: default-src 'self'; 
     script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
     img-src 'self' https://*.supabase.co https://images.unsplash.com;
   ```

2. **Add Security Headers**
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`

3. **Implement Request Signing**
   - Sign webhooks to Typesense/reindex endpoints
   - Verify origin on sensitive server actions

4. **Add CAPTCHA to Onboarding**
   - Currently only on lead submission
   - Add Turnstile to vendor onboarding to prevent fake vendor spam

### Performance Optimizations

1. **Database Indexing**
   ```sql
   -- Add these indexes for common queries
   CREATE INDEX idx_vehicles_status_price ON vehicles(status, price_per_day_aud);
   CREATE INDEX idx_vehicles_location ON vehicles(city, state) WHERE status = 'approved';
   CREATE INDEX idx_leads_vendor_status ON leads(vendor_id, status, created_at);
   ```

2. **Caching Strategy**
   - Cache plan limits, vehicle counts
   - Use Next.js `unstable_cache` for public listings
   - Implement CDN caching for approved vehicle images

3. **Connection Pooling**
   - Configure Supabase connection pooling for serverless
   - Monitor for connection exhaustion under load

### Compliance & Legal

1. **Australian Privacy Compliance**
   - Add privacy policy acceptance tracking
   - Implement data retention policies (lead auto-deletion)
   - Add customer data export functionality

2. **Terms of Service Tracking**
   - Store ToS version with each legal acceptance
   - Force re-acceptance on material changes

3. **Accessibility (WCAG 2.1)**
   - Add ARIA labels to all interactive elements
   - Ensure keyboard navigation throughout
   - Test with screen readers

### Monitoring & Observability

1. **Structured Logging**
   ```typescript
   // Replace console.log with structured logger
   logger.info('lead.created', { 
     leadId, 
     vendorId, 
     ipHash: hashedIp,
     userAgent: req.headers.get('user-agent')
   });
   ```

2. **Error Tracking**
   - Integrate Sentry or similar for exception tracking
   - Set up alerts for webhook failures, rate limit spikes

3. **Business Metrics**
   - Track lead conversion rates
   - Monitor vendor onboarding funnel
   - Alert on suspicious patterns (many leads, no conversions)

### Code Quality

1. **Testing Coverage**
   - Current: Only basic validation tests
   - Needed: API route tests, RLS policy tests, integration tests

2. **Type Safety**
   - Generate types from database schema using `supabase gen types`
   - Use strict TypeScript configuration

3. **Documentation**
   - API documentation for vendor webhooks
   - Environment variable reference
   - Deployment checklist

---

## Code References

### Security Controls
- RLS Policies: `supabase/migrations/20260527100000_initial_enterprise_marketplace.sql:320-463`
- Auth Helpers: `src/lib/security/auth.ts`
- Rate Limiting: `src/lib/security/rate-limit.ts`
- Admin Checks: `src/lib/data/vendor.ts:80-96`

### Critical APIs
- Lead Submission: `src/app/api/leads/route.ts`
- Stripe Webhook: `src/app/api/stripe/webhook/route.ts`
- Checkout: `src/app/api/billing/checkout/route.ts`
- Moderation: `src/app/api/admin/moderation/route.ts`

### Data Layer
- Validation: `src/lib/validation/schemas.ts`
- Vendor Context: `src/lib/data/vendor.ts`
- Supabase Clients: `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`

---

## Conclusion

The Carhire marketplace demonstrates **excellent security architecture and design patterns** but is currently a **sophisticated scaffold requiring significant feature implementation** before production use.

**Immediate Actions Required:**
1. Fix Stripe webhook processing (subscription state updates)
2. Implement vehicle limit enforcement
3. Build real vehicle CRUD operations
4. Replace mock data with live Supabase queries
5. Fix lead notification emails

**Estimated Timeline to Production:**
- 2 developers: 4-6 weeks
- 1 developer: 8-10 weeks

**Confidence Level:** With the identified issues addressed, this architecture can support a secure, scalable marketplace operation.

---

*Report generated by Claude Security Analysis*  
*For questions or clarifications, review the referenced code locations above.*
