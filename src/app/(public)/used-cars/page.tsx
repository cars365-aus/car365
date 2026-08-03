import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { ListingBreadcrumbs } from "@/components/listing-breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { listingMetadata } from "@/lib/seo/listing";

const TITLE = "Used Cars for Sale in Sydney, NSW";
const DESCRIPTION =
  "Browse quality, inspected used cars for sale in Granville, Sydney. Filter by make, model, body type and price, with finance and trade-ins available Australia-wide.";

export const revalidate = 60;

type SP = Record<string, string | string[] | undefined>;

/**
 * Metadata is generated per-request because indexability depends on the query
 * string: the clean hub is indexable and self-canonical, while filtered/sorted
 * permutations are `noindex, follow` and canonicalise back here.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  return listingMetadata({
    basePath: "/used-cars",
    sp: await searchParams,
    title: TITLE,
    description: DESCRIPTION,
    keywords: ["used cars for sale", "second hand cars Sydney", "used car dealer NSW", "cheap used cars Australia"],
  });
}

export default async function UsedCarsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  return (
    <>
      <JsonLd schema={collectionPageSchema({ name: TITLE, description: DESCRIPTION, path: "/used-cars" })} />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ListingBreadcrumbs trail={[["Used Cars", "/used-cars"]]} />
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used cars for sale in Sydney</h1>
          <p className="mt-1 text-body">
            Quality, inspected cars ready to drive away — every vehicle comes with a roadworthy
            certificate, transparent pricing and finance options.
          </p>
        </header>
        <InventoryListingView baseFilters={{}} sp={sp} basePath="/used-cars" />
      </main>
      <SiteFooter />
    </>
  );
}
