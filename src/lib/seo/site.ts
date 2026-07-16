import { optionalEnv } from "@/lib/config";

/** Canonical site origin (no trailing slash) for SEO URLs. */
export function siteBaseUrl(): string {
  const raw = optionalEnv("NEXT_PUBLIC_APP_URL") || "https://www.cars-365.com.au";
  return raw.replace(/\/$/, "");
}
