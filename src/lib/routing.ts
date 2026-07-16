/** Validates that a redirect target is a safe same-origin relative path. */
export function isSafeRedirectPath(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return false;
  if (next.includes(":")) return false;
  return true;
}

/** The staff admin panel — the only authenticated zone on the site. */
export function isAdminZone(path: string): boolean {
  return path.startsWith("/admin") && !path.startsWith("/admin-login");
}
