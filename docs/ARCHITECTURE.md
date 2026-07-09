# Architecture Overview

## Technology Stack
- **Frontend & Backend Framework**: Next.js 16.2.6 (App Router paradigm)
- **UI & Styling**: React 19.2.4, Tailwind CSS v4, Framer Motion, shadcn/ui, Lucide React
- **Database & Auth**: Supabase (PostgreSQL), Supabase Auth (`@supabase/ssr`)
- **Search Engine**: Typesense
- **Emails**: Resend
- **Billing**: Stripe
- **Security & Bot Protection**: Upstash Redis (Rate limiting), Cloudflare Turnstile

## Application Boundaries
The repository is structured to separate different user boundaries:
1. **Public Marketplace (`src/app/(public)`)**: SEO-optimized pages for locations, vehicle search, pricing, and vendor directories.
2. **Customer Portal (`src/app/customer`)**: Dashboard for authenticated renters to view saved cars and enquiries.
3. **Vendor Portal (`src/app/vendor`)**: SaaS dashboard for fleet operators to manage vehicles, bulk upload CSVs, handle leads, and view analytics.
4. **Admin Panel (`src/app/admin`)**: Internal global control room for moderating listings, reviewing fraud flags, and managing platform settings.

## Data Flow
- **Client to Server**: Actions are primarily handled via React Server Actions (`src/app/actions`, `src/lib/actions`). Server-side validation is done using Zod (`src/lib/validation`).
- **Authentication**: `requireUser()` and `requireAdmin()` helpers located in `src/lib/security/auth.ts` enforce RBAC strictly at the layout and action level.
- **Search Syncing**: Vehicles are synchronized with Typesense via Edge Functions or background API triggers (`supabase/functions/search-index-worker`).

## Security Architecture
- **Rate Limiting**: Applied on all `/api` endpoints and critical server actions using Redis (`src/lib/security/rate-limit-redis.ts`).
- **Fraud Engine**: Fraud flags are automatically generated and reviewed by admins for suspicious patterns.
- **Bot Protection**: Cloudflare Turnstile integration protects contact and enquiry forms.
