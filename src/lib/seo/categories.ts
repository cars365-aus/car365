export const VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "People mover",
  "Van",
  "Ute",
  "Luxury",
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

const CATEGORY_SLUG_MAP: Record<string, VehicleCategory> = {
  sedan: "Sedan",
  suv: "SUV",
  "people-mover": "People mover",
  van: "Van",
  ute: "Ute",
  luxury: "Luxury",
};

const CATEGORY_TO_SLUG: Record<VehicleCategory, string> = {
  Sedan: "sedan",
  SUV: "suv",
  "People mover": "people-mover",
  Van: "van",
  Ute: "ute",
  Luxury: "luxury",
};

export function categoryToSlug(category: string): string {
  const normalized = category as VehicleCategory;
  if (CATEGORY_TO_SLUG[normalized]) {
    return CATEGORY_TO_SLUG[normalized];
  }
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): VehicleCategory | null {
  return CATEGORY_SLUG_MAP[slug.toLowerCase()] ?? null;
}

export function isCategorySlug(segment: string): boolean {
  return slugToCategory(segment) !== null;
}

export function isValidCategory(category: string): category is VehicleCategory {
  return (VEHICLE_CATEGORIES as readonly string[]).includes(category);
}
