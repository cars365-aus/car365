import { formatPrice } from "@/lib/nav";

export function makeTitle(make: string) {
  return `Used ${make} for Sale in Granville, NSW`;
}

export function makeDescription(make: string) {
  return `Browse our range of quality used ${make} vehicles for sale in Granville, NSW. Inspected, priced honestly, with finance and trade-ins available across Australia.`;
}

export function makeModelTitle(make: string, model: string) {
  return `Used ${make} ${model} for Sale in Granville, NSW`;
}

export function makeModelDescription(make: string, model: string) {
  return `Find the best deals on used ${make} ${model} cars in Granville, Sydney. Every car is fully inspected and comes with a roadworthy certificate.`;
}

export function budgetTitle(budget: number) {
  return `Used Cars Under ${formatPrice(budget)} in Sydney, NSW`;
}

export function budgetDescription(budget: number) {
  return `Looking for reliable used cars under ${formatPrice(budget)}? Browse our inspected inventory in Granville, NSW. Finance and trade-ins welcome.`;
}

export function bodyTypeTitle(body: string) {
  return `Used ${body}s for Sale in Granville, NSW`;
}

export function bodyTypeDescription(body: string) {
  return `Browse quality used ${body} vehicles in Granville, Sydney. Find your next car with transparent pricing and fast approvals.`;
}
