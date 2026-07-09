import type { VehicleCategory } from "./categories";
import { getCityMeta } from "./slugs";

export function vehicleTitle(title: string, city?: string) {
  return `${title} – Car Hire${city ? ` in ${city}` : ""} | Hire Car`;
}

export function vehicleDescription(input: {
  year: number;
  make: string;
  model: string;
  category: string;
  pricePerDayAud: number;
  city?: string;
  state?: string;
}) {
  const location =
    input.city && input.state
      ? ` in ${input.city}, ${input.state}`
      : input.city
        ? ` in ${input.city}`
        : "";
  return `Hire a ${input.year} ${input.make} ${input.model} (${input.category}) for $${input.pricePerDayAud}/day${location}. Verified local rental operator.`;
}

export function cityTitle(citySlug: string, state?: string, lowestPrice?: number) {
  const { title } = getCityMeta(citySlug, state);
  const priceString = lowestPrice ? ` (From $${lowestPrice}/day)` : "";
  return `Car Hire ${title}${state ? ` ${state}` : ""}${priceString} | Hire Car`;
}

export function cityDescription(citySlug: string, state?: string) {
  return getCityMeta(citySlug, state).description;
}

export function categoryNationalTitle(category: VehicleCategory) {
  return `${category} Car Hire Australia | Hire Car`;
}

export function categoryNationalDescription(category: VehicleCategory, total: number) {
  return `Compare ${total} ${category} rental vehicles across Australia from verified local operators. No booking fees — contact vendors directly.`;
}

export function cityCategoryTitle(citySlug: string, category: VehicleCategory, state?: string, lowestPrice?: number) {
  const { title } = getCityMeta(citySlug, state);
  const priceString = lowestPrice ? ` (From $${lowestPrice}/day)` : "";
  return `${category} Hire ${title}${priceString} | Hire Car`;
}

export function cityCategoryDescription(
  citySlug: string,
  category: VehicleCategory,
  total: number,
  state?: string,
) {
  const { title } = getCityMeta(citySlug, state);
  return `Find ${total} ${category} vehicles for hire in ${title}. Compare daily rates from verified local rental operators on Hire Car.`;
}

export function brandCityTitle(brand: string, citySlug: string) {
  const { title } = getCityMeta(citySlug);
  return `${brand} Car Hire in ${title} | Hire Car`;
}

export function brandCityDescription(brand: string, citySlug: string) {
  const { title } = getCityMeta(citySlug);
  return `Looking for ${brand} car hire in ${title}? Compare local rental operators, find the best daily prices, and book directly.`;
}
