import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { ListingBreadcrumbs } from "@/components/listing-breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getVehicleCount } from "@/lib/data/inventory";
import { parseBodySegment, BODY_TYPE_LABELS } from "@/lib/nav";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { listingMetadata } from "@/lib/seo/listing";
import { bodyTypeTitle, bodyTypeDescription } from "@/lib/seo/templates";

export const revalidate = 300;

type Params = { bodyType: string };
type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const [{ bodyType }, sp] = await Promise.all([params, searchParams]);
  const b = parseBodySegment(bodyType);
  if (!b) return { title: "Used Cars", robots: { index: false, follow: true } };

  const label = BODY_TYPE_LABELS[b];
  return listingMetadata({
    basePath: `/used-cars/body/${bodyType}`,
    sp,
    // Body-type landings now share the location-qualified template used by the
    // make/model/budget landings, so the whole pSEO set targets the same
    // Australian intent instead of one page competing nationally with no geo.
    title: bodyTypeTitle(label),
    description: bodyTypeDescription(label),
    keywords: [`used ${label} for sale`, `${label} for sale Sydney`, `second hand ${label} NSW`],
    thin: { total: await getVehicleCount({ bodyType: b }), kind: "category" },
  });
}

export default async function BodyTypePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  const [{ bodyType }, sp] = await Promise.all([params, searchParams]);
  const b = parseBodySegment(bodyType);
  if (!b) notFound();
  const label = BODY_TYPE_LABELS[b];
  const path = `/used-cars/body/${bodyType}`;

  return (
    <>
      <JsonLd
        schema={collectionPageSchema({
          name: bodyTypeTitle(label),
          description: bodyTypeDescription(label),
          path,
        })}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ListingBreadcrumbs trail={[["Used Cars", "/used-cars"], [label, path]]} />
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used {label} for sale</h1>
          <p className="mt-2 max-w-2xl text-body">
            Browse our range of quality used {label.toLowerCase()} vehicles. Each one is inspected, honestly
            photographed, and ready to drive away — with finance and trade-ins available.
          </p>
        </header>
        <InventoryListingView baseFilters={{ bodyType: b }} sp={sp} basePath={path} hideFilters={["body"]} />
      </main>
      <SiteFooter />
    </>
  );
}
