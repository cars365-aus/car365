# Codebase Guide

## Organization

This guide explains where to find key components within the `src/` directory.

### `src/app` (Next.js App Router)
- **`(public)`**: Contains routes accessible to unauthenticated users. Use this for landing pages, location-based SEO pages, and vendor directory browsing.
- **`admin`**: The global control room for platform operators. Includes moderation tools, fraud review, and overall analytics. Protected by `requireAdmin()`.
- **`vendor`**: The SaaS portal for car rental businesses. This includes vehicle listing management, branch management, and lead tracking. Protected by `requireUser()` and vendor-specific authorization checks.
- **`customer`**: A lighter dashboard for renters to view their saved vehicles and enquiries.
- **`api`**: Contains all Next.js Route Handlers. Webhooks (Stripe), re-indexing triggers (Typesense), and public REST endpoints reside here.

### `src/components` (UI Architecture)
- **`ui/`**: Base level primitives (shadcn/ui style). Includes `button.tsx`, `card.tsx`, `dialog.tsx`.
- **`admin/`**: Components exclusively used in the admin control room.
- **`vendor/`**: Components primarily used by the vendor dashboard (e.g., `bulk-upload.tsx`).
- **Root**: Global shared components like `vehicle-card.tsx`, `site-header.tsx`, `search-widget.tsx`.

### `src/lib` (Core Business Logic)
- **`data/`**: Data access layer functions. Contains grouped files like `admin.ts` and `vendor.ts` to abstract away direct Supabase client calls.
- **`security/`**: Rate limiters, Turnstile captcha validation, and RBAC auth wrappers (`requireUser()`, `requireAdmin()`).
- **`search/`**: Typesense configuration and query helpers.
- **`validation/`**: Zod schemas for validating incoming requests.
- **`billing/`**: Stripe API integration logic.

## Developing & Extending
1. **Adding a new Server Action**: Place it in `src/app/[module]/actions.ts` or `src/lib/actions/` if shared globally. Always validate input with Zod schemas from `src/lib/validation`.
2. **Adding an API route**: Avoid using API routes for internal UI state changes. Use Server Actions instead. Only use `src/app/api/` for external webhooks or public integrations.
3. **Adding UI components**: If it's a primitive, put it in `src/components/ui/`. If it's a composite block, put it in the root or specific domain folder in `src/components/`.

## Best Practices
- **Security First**: Always wrap protected layouts and actions with `await requireUser()` or `await requireAdmin()`.
- **Environment Variables**: Never hardcode keys. Use `.env.local` for development and check `.env.example` for required keys.
- **Data Fetching**: Rely on Server Components and Supabase SSR for fast, secure data loading without exposing DB logic to the client.
