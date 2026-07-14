import { CITY_META_OVERRIDES } from "./constants";

export function cityToSlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function slugToDisplayCity(slug: string): string {
  const override = CITY_META_OVERRIDES[slug.toLowerCase()];
  if (override) return override.title;
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function brandToSlug(brand: string): string {
  return brand.trim().toLowerCase().replace(/\s+/g, "-");
}

export function slugToDisplayBrand(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCityMeta(slug: string, fallbackState = "") {
  const key = slug.toLowerCase();
  const override = CITY_META_OVERRIDES[key];
  const title = override?.title ?? slugToDisplayCity(slug);
  const state = override?.state ?? fallbackState;
  const description =
    override?.description ??
    `Find cheap car hire in ${title}${state ? `, ${state}` : ""}. Compare vehicles from verified local rental operators on Cars365.`;
  return { title, state, description, slug: key };
}
