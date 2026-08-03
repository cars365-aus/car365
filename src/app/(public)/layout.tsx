import { JsonLd } from "@/components/json-ld";
import { getCompanyProfile, getPhoneNumbers } from "@/lib/data/settings";
import { getActiveLocations } from "@/lib/data/locations";
import { autoDealerSchema, organizationSchema, websiteSchema } from "@/lib/seo/jsonld";

/**
 * Site-wide entity graph for every public page (SRS §16.4).
 *
 * Emits three linked nodes rather than the single AutoDealer this layout used
 * to publish:
 *   • Organization — the brand entity behind the knowledge panel. The site
 *     previously published none at all; the only builder for it lived in the
 *     dead rental-era `seo/schema.ts` and described the wrong business.
 *   • WebSite + SearchAction — makes the site eligible for a Google sitelinks
 *     searchbox, and was likewise never rendered anywhere.
 *   • AutoDealer — the physical Granville storefront, now linked to the brand
 *     via `parentOrganization` so the two don't compete as separate entities.
 *
 * All three carry stable `@id`s so per-page nodes (Vehicle offers, breadcrumbs,
 * collection pages) reference them instead of redeclaring detached copies.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [company, locations, phones] = await Promise.all([
    getCompanyProfile(),
    getActiveLocations(),
    getPhoneNumbers(),
  ]);

  const rating = (company.google_rating as number) ?? null;
  const reviewCount = (company.google_review_count as number) ?? null;
  const email = (company.email as string) ?? null;

  const graph = [
    organizationSchema({ phone: phones.whatsapp || phones.primary, email, rating, reviewCount }),
    websiteSchema(),
    autoDealerSchema({
      name: (company.trading_name as string) || "Cars365",
      email,
      phone: phones.primary,
      rating,
      reviewCount,
      location: locations[0] ?? null,
      priceRange: (company.price_range as string) || "$$",
    }),
  ];

  return (
    <>
      <JsonLd schema={graph} />
      <div className="dark bg-background text-foreground min-h-screen">
        {children}
      </div>
    </>
  );
}
