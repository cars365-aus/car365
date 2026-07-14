export type AuthRole = "customer" | "vendor";

/** Validates that a redirect target is a safe same-origin relative path. */
export function isSafeRedirectPath(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return false;
  if (next.includes(":")) return false;
  return true;
}

export function isCustomerZone(path: string): boolean {
  return path.startsWith("/account");
}

export function isVendorZone(path: string): boolean {
  return path.startsWith("/vendor");
}

export function isAdminZone(path: string): boolean {
  return path.startsWith("/admin") && !path.startsWith("/admin-login");
}

/** Paths either role may return to after sign-in (e.g. shared chat). */
export function isSharedAuthenticatedPath(path: string): boolean {
  return path.startsWith("/messages");
}

/** Public/marketplace paths — safe for any role after sign-in. */
export function isPublicPath(path: string): boolean {
  return (
    !isCustomerZone(path) &&
    !isVendorZone(path) &&
    !isAdminZone(path)
  );
}

export function isValidRedirectForRole(
  path: string | null | undefined,
  role: AuthRole,
): boolean {
  if (!path || !isSafeRedirectPath(path)) return false;
  if (isSharedAuthenticatedPath(path) || isPublicPath(path)) return true;
  if (role === "customer") return isCustomerZone(path);
  return isVendorZone(path);
}

export function defaultDashboardForRole(
  role: AuthRole,
  plan?: string | null,
): string {
  if (role === "vendor") {
    return buildVendorUpgradeHref({ plan });
  }
  return "/account";
}

export function resolvePostAuthDestination(
  role: AuthRole | null,
  rawNext?: string | null,
  plan?: string | null,
): string {
  const fallbackRole = role ?? "customer";
  const fallback = defaultDashboardForRole(fallbackRole, plan);

  if (rawNext && isSafeRedirectPath(rawNext)) {
    if (!role || isValidRedirectForRole(rawNext, role)) {
      return rawNext;
    }
  }

  return fallback;
}

/** Vendor routes accessible before the user has an organization. */
export function isVendorPreOrgPath(path: string): boolean {
  return (
    path === "/vendor/upgrade" ||
    path.startsWith("/vendor/upgrade/") ||
    path === "/vendor/onboarding" ||
    path.startsWith("/vendor/onboarding/")
  );
}

/** @deprecated Use isVendorPreOrgPath */
export function isVendorOnboardingPath(path: string): boolean {
  return isVendorPreOrgPath(path);
}

export function buildVendorOnboardingHref(options?: {
  plan?: string | null;
  from?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options?.plan) params.set("plan", options.plan);
  if (options?.from && isSafeRedirectPath(options.from)) {
    params.set("from", options.from);
  }
  const query = params.toString();
  return query ? `/vendor/onboarding?${query}` : "/vendor/onboarding";
}

export function buildVendorUpgradeHref(options?: {
  plan?: string | null;
  from?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options?.plan) params.set("plan", options.plan);
  if (options?.from && isSafeRedirectPath(options.from)) {
    params.set("from", options.from);
  }
  const query = params.toString();
  return query ? `/vendor/upgrade?${query}` : "/vendor/upgrade";
}
