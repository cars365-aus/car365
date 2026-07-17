import { JsonLd } from "@/components/json-ld";
import { getCompanyProfile } from "@/lib/data/settings";
import { getActiveLocations } from "@/lib/data/locations";
import { autoDealerSchema } from "@/lib/seo/jsonld";

// Site-wide organization/dealer JSON-LD for every public page (SRS §16.4).
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [company, locations] = await Promise.all([getCompanyProfile(), getActiveLocations()]);

  const dealer = autoDealerSchema({
    name: (company.trading_name as string) || "Cars365",
    email: (company.email as string) ?? null,
    rating: (company.google_rating as number) ?? null,
    reviewCount: (company.google_review_count as number) ?? null,
    location: locations[0] ?? null,
  });

  return (
    <>
      <JsonLd schema={dealer} />
      <div className="bg-background text-foreground min-h-screen">
        {children}
      </div>
    </>
  );
}
