import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { ListingBreadcrumbs } from "@/components/listing-breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getMakes, getModelsForMake, getVehicleCount } from "@/lib/data/inventory";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { listingMetadata } from "@/lib/seo/listing";
import { makeModelTitle, makeModelDescription } from "@/lib/seo/templates";

export const revalidate = 300;

type Params = { make: string; model: string };
type SP = Record<string, string | string[] | undefined>;

async function resolve(makeSlug: string, modelSlug: string) {
  const [makes, models] = await Promise.all([getMakes(), getModelsForMake(makeSlug)]);
  const make = makes.find((m) => m.slug === makeSlug) ?? null;
  const model = models.find((m) => m.slug === modelSlug) ?? null;
  return { make, model };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const [{ make, model }, sp] = await Promise.all([params, searchParams]);
  const r = await resolve(make, model);
  if (!r.make || !r.model) return { title: "Used Cars", robots: { index: false, follow: true } };

  return listingMetadata({
    basePath: `/used-cars/${r.make.slug}/${r.model.slug}`,
    sp,
    title: makeModelTitle(r.make.name, r.model.name),
    description: makeModelDescription(r.make.name, r.model.name),
    keywords: [
      `used ${r.make.name} ${r.model.name}`,
      `${r.make.name} ${r.model.name} for sale`,
      `second hand ${r.make.name} ${r.model.name} Sydney`,
    ],
    thin: {
      total: await getVehicleCount({ make: r.make.slug, model: r.model.slug }),
      kind: "makeModel",
    },
  });
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  const [{ make, model }, sp] = await Promise.all([params, searchParams]);
  const { make: mk, model: md } = await resolve(make, model);
  if (!mk || !md) notFound();

  const path = `/used-cars/${mk.slug}/${md.slug}`;

  return (
    <>
      <JsonLd
        schema={collectionPageSchema({
          name: makeModelTitle(mk.name, md.name),
          description: makeModelDescription(mk.name, md.name),
          path,
        })}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ListingBreadcrumbs
          trail={[["Used Cars", "/used-cars"], [mk.name, `/used-cars/${mk.slug}`], [md.name, path]]}
        />
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used {mk.name} {md.name} for sale</h1>
          <p className="mt-2 max-w-2xl text-body">
            See our current {mk.name} {md.name} stock. Every car is inspected, photographed honestly, and backed by a
            team that answers fast — with finance and trade-ins available.
          </p>
        </header>
        <InventoryListingView
          baseFilters={{ make: mk.slug, model: md.slug }}
          sp={sp}
          basePath={path}
          hideFilters={["make"]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
