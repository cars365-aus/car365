# Security & Authentication Boundaries

Cars365 uses a defense-in-depth approach utilizing Supabase Auth, Row Level Security, and Next.js middleware.

## Auth Model
- Authentication is handled exclusively by Supabase via OTP Magic Links.
- Session tokens (JWTs) are stored in HttpOnly secure cookies managed by `@supabase/ssr`.

## Authorization (Tenant Boundaries)
- **Customer Scope**: Customers can only view their own saved vehicles and enquiries.
- **Vendor Scope**: Vendors are constrained to the `organization_id` tied to their User ID.
- **Admin Scope**: Only users with specific boolean flags or roles can bypass tenant constraints.

## Middleware Enforcements
`middleware.ts` acts as the first line of defense:
- Requests to `/customer/*` require a valid JWT.
- Requests to `/vendor/*` require a valid JWT.
- Requests to `/admin/*` require a valid JWT with the admin claim.

## Row Level Security (RLS)
The database enforces tenant boundaries at the SQL level. Even if a Server Action incorrectly attempts to query a vehicle from another tenant using the standard authenticated client, the database will return `0 rows`.

## Secrets Handling
- Keys prefixed with `NEXT_PUBLIC_` are safely exposed to the browser.
- Service Role Keys (`SUPABASE_SERVICE_ROLE_KEY`) and Webhook Secrets (`STRIPE_WEBHOOK_SECRET`) must never leave the server environment (`process.env`).

## Rate Limiting & Bot Protection
- **Turnstile**: Public forms (Enquiries, Contact) require a valid Cloudflare Turnstile token to prevent spam.
- **Redis Rate Limiting**: The `/api/search` route utilizes Upstash Redis sliding window limits (30 requests/minute) to prevent scraping and DDoS attacks.
