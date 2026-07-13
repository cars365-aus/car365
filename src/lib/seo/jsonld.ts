import { siteBaseUrl } from "@/lib/seo/site";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/nav";
import type { VehicleDetail, Testimonial, Faq, LocationBranch } from "@/lib/domain";

/** JSON-LD builders (SRS §16.4). All return plain objects; render with <JsonLd>. */

const CONTEXT = "https://schema.org";

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const base = siteBaseUrl();
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  };
}

export function itemListSchema(paths: string[]) {
  const base = siteBaseUrl();
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    itemListElement: paths.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}${p}` })),
  };
}

export function faqPageSchema(faqs: Pick<Faq, "question" | "answer">[]) {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function vehicleSchema(v: VehicleDetail, opts: { path: string; sellerName: string }) {
  const base = siteBaseUrl();
  const availability =
    v.status === "sold" ? "https://schema.org/SoldOut"
    : v.status === "reserved" ? "https://schema.org/LimitedAvailability"
    : "https://schema.org/InStock";
  return {
    "@context": CONTEXT,
    "@type": "Vehicle",
    name: `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""}`,
    brand: { "@type": "Brand", name: v.makeName },
    model: v.modelName,
    vehicleModelDate: String(v.year),
    bodyType: BODY_TYPE_LABELS[v.bodyType],
    fuelType: FUEL_LABELS[v.fuelType],
    vehicleTransmission: TRANSMISSION_LABELS[v.transmission],
    ...(v.exteriorColor ? { color: v.exteriorColor } : {}),
    ...(v.seats ? { seatingCapacity: v.seats } : {}),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileageKm, unitCode: "KMT" },
    ...(v.images[0]?.url ? { image: v.images[0].url } : {}),
    offers: {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "AUD",
      availability,
      itemCondition: "https://schema.org/UsedCondition",
      url: `${base}${opts.path}`,
      seller: { "@type": "AutoDealer", name: opts.sellerName },
    },
  };
}

export function autoDealerSchema(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  location?: LocationBranch | null;
}) {
  const base = siteBaseUrl();
  const loc = input.location;
  return {
    "@context": CONTEXT,
    "@type": "AutoDealer",
    name: input.name,
    url: base,
    ...(input.email ? { email: input.email } : {}),
    ...(loc?.phone || input.phone ? { telephone: loc?.phone ?? input.phone } : {}),
    ...(loc
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: loc.address,
            addressLocality: loc.city,
            addressRegion: loc.state,
            postalCode: loc.postcode ?? undefined,
            addressCountry: "AU",
          },
          ...(loc.lat && loc.lng ? { geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng } } : {}),
        }
      : {}),
    ...(input.rating && input.reviewCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: input.rating, reviewCount: input.reviewCount } }
      : {}),
  };
}

export function reviewsAggregateSchema(testimonials: Testimonial[]) {
  if (testimonials.length === 0) return null;
  const avg = testimonials.reduce((a, t) => a + t.rating, 0) / testimonials.length;
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: "Cars365 used cars",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: testimonials.length,
    },
    review: testimonials.slice(0, 10).map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.customerName },
      reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
      reviewBody: t.quote,
      ...(t.reviewDate ? { datePublished: t.reviewDate } : {}),
    })),
  };
}

export function articleSchema(input: { title: string; path: string; publishedAt?: string | null; image?: string | null; author?: string | null }) {
  const base = siteBaseUrl();
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: input.title,
    mainEntityOfPage: `${base}${input.path}`,
    ...(input.image ? { image: input.image } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.author ? { author: { "@type": "Person", name: input.author } } : {}),
    publisher: { "@type": "Organization", name: "Cars365" },
  };
}
