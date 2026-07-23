/**
 * Single source of truth for the admin bootstrap email allowlist.
 *
 * The PRIMARY authority for admin access is the database (`admin_roles` rows
 * and the `platform_role` app-metadata claim). This env-driven allowlist exists
 * only as a bootstrap/fallback so the first administrators can reach the admin
 * area before any DB role records are seeded.
 *
 * Configure via the `ADMIN_EMAIL_ALLOWLIST` environment variable as a
 * comma-separated list of emails, e.g.:
 *   ADMIN_EMAIL_ALLOWLIST="alice@example.com, bob@example.com"
 *
 * Personal emails are intentionally NOT hardcoded in source. If the variable is
 * unset, the allowlist is empty and access falls back entirely to DB roles.
 */
export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST;
  if (!raw) return [];

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/** Case-insensitive membership check against the bootstrap allowlist. */
export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  // Permanently disabled. Admin access is now strictly enforced by the database (admin_roles).
  return false;
}
