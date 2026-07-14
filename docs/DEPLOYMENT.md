# Deployment & Operations Guide

Cars365 is optimized for a Serverless Edge deployment model using Vercel.

## Required Services
1. **Vercel** (Hosting, CDN, CI/CD, ISR Caching)
2. **Supabase** (Database, Auth, Storage, Edge Functions)
3. **Typesense Cloud** (Search indexing)
4. **Resend** (Transactional Email)
5. **Stripe** (Subscriptions/Billing)
6. **Cloudflare Turnstile** (Captcha)

## Production Deployment Steps

1. **Connect Vercel to GitHub:**
   Import the repository into Vercel. Vercel will automatically detect Next.js and apply the correct build settings (`npm run build`).

2. **Set Environment Variables:**
   Populate all variables defined in `.env.example` directly in the Vercel Project Settings.

   **Required in production (do not skip):**
   - `NEXT_PUBLIC_APP_URL` — the public https site URL (e.g. `https://www.hirecarmarketplace.com.au`). If unset, emails and redirects fall back to `localhost` and break.
   - `REDIS_URL` — distributed rate limiting for leads/contact/webhooks. Without it, limits fall back to per-instance in-memory state and are **not** enforced across serverless instances (anti-spam/abuse effectively disabled).
   - `ADMIN_EMAIL_ALLOWLIST` — comma-separated bootstrap admin emails. The primary admin authority is the database (`admin_roles` / `platform_role`); this allowlist only bootstraps the first admins. Set it (or ensure those users have `admin_roles` rows) to avoid admin lockout.

   Optional: `NEXT_PUBLIC_SOCIAL_X_URL`, `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL`, `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL` — footer social links; any left unset are hidden.

   **CI build job (optional):** to enable the opt-in `build` job in `.github/workflows/ci.yml`, set the repo variable `RUN_BUILD=true` and provide `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as Actions secrets (plus the `NEXT_PUBLIC_APP_URL` variable).

3. **Deploy Supabase Migrations:**
   Ensure your local Supabase CLI is linked to your production project, then run:
   ```bash
   supabase db push
   ```

4. **Deploy Supabase Edge Functions:**
   ```bash
   supabase functions deploy search-index-worker
   supabase functions deploy lead-cleanup
   ```

5. **Configure Storage:**
   Ensure the `vehicle-images` bucket in Supabase is set to **Public**.

6. **Trigger Initial Search Index:**
   Send a POST request to `https://[YOUR_DOMAIN]/api/search/reindex` with the `Authorization: Bearer <WORKER_API_KEY>` header to seed the Typesense cluster.

## Health Checks
Uptime monitoring services (e.g., UptimeRobot, Datadog) should be pointed to:
`GET https://[YOUR_DOMAIN]/api/health`
The public probe is read-only and returns `{ status: "ok" | "unhealthy", timestamp }`
(HTTP 200 when healthy, 503 otherwise), verifying Vercel edge execution and
Supabase connectivity without performing writes or leaking config. For a deeper
diagnostic (includes a webhook-table write probe), send
`Authorization: Bearer <WORKER_API_KEY>`.

## Rollback Plan
If a bad deployment hits production, **do not write a downward database migration**. 
1. Use the Vercel dashboard to "Promote to Production" the previous successful build.
2. Fix the bug locally.
3. Push a new forward-fix commit.
