/**
 * Registry of every external API this application calls.
 *
 * ── What this is, and what it is NOT ────────────────────────────────────────
 * A *declared* catalogue: plan quotas and unit prices are published figures
 * recorded here by hand, not values fetched from each vendor's billing API.
 * Costs shown in the admin dashboard are therefore **estimates computed from
 * requests this application made**, and are labelled as such in the UI.
 *
 * They will not match an invoice, and are not meant to. They exist to answer
 * "are we about to blow through a free tier?" and "which integration is
 * generating all this traffic?" — questions the vendor dashboards answer
 * slowly, per-vendor, and only for whoever has the logins.
 *
 * Authoritative billing lives with each provider; `consoleUrl` links there.
 *
 * ── Every entry was verified against the code, not assumed ──────────────────
 * The list below is what `src/` actually calls. Notably it does NOT include
 * Google Maps Geocoding: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is declared in
 * `.env.example` but referenced nowhere, and the only Google Maps surface is an
 * unauthenticated `<iframe>` embed in the footer, which is not a billable API
 * call. Geocoding actually runs through Photon.
 *
 * Prices change. Each entry carries `pricingCheckedOn` so a stale figure is
 * visible rather than silently trusted, and the dashboard surfaces that date.
 */

export type ProviderCategory =
  | "infrastructure" | "communications" | "search" | "security" | "geocoding" | "monitoring" | "syndication";

export type UsageUnit = "request" | "email" | "search";

export type ApiProvider = {
  /** Stable key used as the metrics counter namespace. Never change it. */
  code: string;
  name: string;
  category: ProviderCategory;
  /** What one counted unit represents, for the dashboard's wording. */
  unit: UsageUnit;
  /**
   * Whether this app records counters for the provider. False means the
   * dashboard shows configuration and a console link, but no request numbers —
   * shown honestly as "not counted" rather than a misleading zero.
   */
  tracked: boolean;
  /**
   * Env vars whose presence means the integration is configured. Empty array
   * means the service needs no credentials.
   */
  configuredBy: string[];
  /** Documented allowance per month for `planLabel`, or null if unmetered. */
  monthlyQuota: number | null;
  planLabel: string;
  /**
   * Estimated AUD per 1,000 units beyond the quota. `null` where the provider
   * does not price per request (flat-rate/node-hour plans) — the dashboard then
   * shows usage without a cost rather than implying the service is free.
   */
  audPer1000: number | null;
  /** ISO date the quota/price above was last verified against vendor docs. */
  pricingCheckedOn: string;
  consoleUrl: string;
  /** Where in this codebase the calls originate — makes spikes diagnosable. */
  callSite: string;
  /** Shown when usage is high, to tell staff what to actually do about it. */
  notes?: string;
};

/** Verified 2026-08-04 against each vendor's public pricing page and this repo. */
export const API_PROVIDERS: readonly ApiProvider[] = [
  {
    code: "typesense",
    name: "Typesense",
    category: "search",
    unit: "search",
    tracked: true,
    configuredBy: ["TYPESENSE_HOST", "TYPESENSE_API_KEY"],
    monthlyQuota: null,
    planLabel: "Cloud — billed per node-hour",
    audPer1000: null,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://cloud.typesense.org/clusters",
    callSite: "src/lib/search/typesense.ts",
    notes:
      "Cost is flat regardless of search volume, so watch the request trend for capacity and the error count for cluster health — not for spend.",
  },
  {
    code: "ses",
    name: "AWS SES (email)",
    category: "communications",
    unit: "email",
    tracked: true,
    configuredBy: ["SMTP_HOST", "SMTP_USER"],
    monthlyQuota: null,
    planLabel: "Pay-as-you-go",
    audPer1000: 0.15,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://console.aws.amazon.com/ses/home#/account",
    callSite: "src/lib/email/ses.ts",
    notes:
      "Roughly USD $0.10 per 1,000 emails at a nominal conversion. The real risk here is not cost but reputation: a rising error count means bounces, and a high bounce rate suspends sending entirely.",
  },
  {
    code: "photon",
    name: "Photon (geocoding)",
    category: "geocoding",
    unit: "request",
    tracked: true,
    configuredBy: [],
    monthlyQuota: null,
    planLabel: "Free public instance — no SLA",
    audPer1000: 0,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://photon.komoot.io/",
    callSite: "src/app/api/geocode/route.ts",
    notes:
      "Free, unauthenticated and community-run, so there is no quota to breach — but also no availability guarantee and an expectation of fair use. Sustained high volume here is the signal to self-host or move to a paid provider.",
  },
  {
    code: "turnstile",
    name: "Cloudflare Turnstile",
    category: "security",
    unit: "request",
    tracked: true,
    configuredBy: ["TURNSTILE_SECRET"],
    monthlyQuota: null,
    planLabel: "Free — unlimited",
    audPer1000: 0,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://dash.cloudflare.com/?to=/:account/turnstile",
    callSite: "src/lib/security/turnstile.ts",
    notes:
      "Free at any volume. Counted to show form-submission pressure: a spike in failures usually means a bot campaign against the enquiry forms.",
  },
  {
    code: "supabase",
    name: "Supabase",
    category: "infrastructure",
    unit: "request",
    tracked: false,
    configuredBy: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    monthlyQuota: null,
    planLabel: "Usage-based (storage, egress, MAU)",
    audPer1000: null,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://supabase.com/dashboard/project/_/settings/billing/usage",
    callSite: "src/lib/supabase/*, src/lib/data/*",
    notes:
      "Deliberately not counted: Supabase is queried on nearly every render, so instrumenting it would add overhead to the pages that serve the car listings. It also bills on database size, egress and active users rather than per query, so a request count would not predict the bill anyway.",
  },
  {
    code: "sentry",
    name: "Sentry",
    category: "monitoring",
    unit: "request",
    tracked: false,
    configuredBy: ["NEXT_PUBLIC_SENTRY_DSN"],
    monthlyQuota: 5_000,
    planLabel: "Developer tier — 5,000 errors/month",
    audPer1000: null,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://sentry.io/organizations/",
    callSite: "@sentry/nextjs (client + server SDK)",
    notes:
      "Events are sent by the SDK directly from the browser and server, bypassing this app's code, so they cannot be counted here. Check the quota in Sentry — exceeding it silently drops errors, which is worse than the bill.",
  },
] as const;

/** Declared for the syndication module but not yet wired. */
export const PLANNED_PROVIDERS: readonly ApiProvider[] = [
  {
    code: "google_merchant",
    name: "Google Merchant Center",
    category: "syndication",
    unit: "request",
    tracked: false,
    configuredBy: ["GOOGLE_MERCHANT_CENTER_ID"],
    monthlyQuota: null,
    planLabel: "Free — Vehicle Ads add-on",
    audPer1000: null,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://merchants.google.com/",
    callSite: "not yet implemented (syndication Sprint 4)",
    notes: "Feed ingestion is free; ad spend sits in the linked Google Ads account, not here.",
  },
  {
    code: "meta_catalog",
    name: "Meta Catalog / Marketplace",
    category: "syndication",
    unit: "request",
    tracked: false,
    configuredBy: ["META_APP_ID", "META_CATALOG_ID"],
    monthlyQuota: null,
    planLabel: "Free — rate limited per app",
    audPer1000: null,
    pricingCheckedOn: "2026-08-04",
    consoleUrl: "https://business.facebook.com/commerce/",
    callSite: "not yet implemented (syndication Sprint 5)",
    notes: "No per-call charge, but Graph API rate limits apply. Blocked on Inventory Partner approval.",
  },
] as const;

/** Provider codes this app records counters for. */
export const TRACKED_PROVIDER_CODES = API_PROVIDERS.filter((p) => p.tracked).map((p) => p.code);

export function getProvider(code: string): ApiProvider | undefined {
  return [...API_PROVIDERS, ...PLANNED_PROVIDERS].find((p) => p.code === code);
}

/** True when every env var the integration needs is present. */
export function isProviderConfigured(provider: ApiProvider): boolean {
  if (provider.configuredBy.length === 0) return true;
  return provider.configuredBy.every((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/**
 * Estimated AUD cost for `units` calls, counting only usage beyond any free
 * quota. Returns null when the provider is not priced per request — showing
 * "$0.00" for a flat-rate plan would imply the service is free, which it isn't.
 */
export function estimateCost(provider: ApiProvider, units: number): number | null {
  if (provider.audPer1000 == null) return null;
  const billable = provider.monthlyQuota == null ? units : Math.max(0, units - provider.monthlyQuota);
  return (billable / 1000) * provider.audPer1000;
}

/** Percentage of the monthly quota consumed, or null when there is no quota. */
export function quotaUsedPct(provider: ApiProvider, units: number): number | null {
  if (!provider.monthlyQuota) return null;
  return Math.min(100, (units / provider.monthlyQuota) * 100);
}
