// Shared resolution for the brand's social profile links.
//
// The NEXT_PUBLIC_SOCIAL_* env vars are optional. Some deploy environments set
// them to a placeholder ("#") rather than leaving them unset — and because "#"
// is truthy, a naive `envValue || fallback` would render a dead "#" link over
// the real profile. `resolveSocialUrl` treats empty/whitespace/"#" as unset so
// the canonical fallback (or nothing) always wins.

export const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/profile.php?id=61590659316054",
  linkedin: "https://www.linkedin.com/company/hirecar-marketplace/",
  instagram: "https://www.instagram.com/hire.carmarketplace",
} as const;

export function resolveSocialUrl(
  envValue: string | undefined,
  fallback?: string,
): string | undefined {
  const trimmed = envValue?.trim();
  if (trimmed && trimmed !== "#") return trimmed;
  return fallback;
}
