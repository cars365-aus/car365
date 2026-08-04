import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { ListingBreadcrumbs } from "@/components/listing-breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getMakes, getVehicleCount } from "@/lib/data/inventory";
import { formatPrice } from "@/lib/nav";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { listingMetadata } from "@/lib/seo/listing";
import { makeTitle, makeDescription, budgetTitle, budgetDescription } from "@/lib/seo/templates";

export const revalidate = 300;

type Params = { make: string };
type SP = Record<string, string | string[] | undefined>;

// The [make] segment doubles as the budget landing (`under-{price}`), since both
// are single dynamic segments under /used-cars and can't be separate routes.
function parseBudget(seg: string): number | null {
  const m = /^under-(\d{3,7})$/.exec(seg);
  return m ? Number(m[1]) : null;
}

async function resolveMake(slug: string) {
  const makes = await getMakes();
  return makes.find((m) => m.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const [{ make }, sp] = await Promise.all([params, searchParams]);
  const budget = parseBudget(make);

  if (budget) {
    return listingMetadata({
      basePath: `/used-cars/under-${budget}`,
      sp,
      title: budgetTitle(budget),
      description: budgetDescription(budget),
      keywords: [`used cars under ${formatPrice(budget)}`, "cheap used cars Sydney", "budget cars NSW"],
      thin: { total: await getVehicleCount({ priceMax: budget }), kind: "category" },
    });
  }

  const m = await resolveMake(make);
  // An unresolved make renders notFound(); keep it out of the index either way.
  if (!m) return { title: "Used Cars", robots: { index: false, follow: true } };

  return listingMetadata({
    basePath: `/used-cars/${m.slug}`,
    sp,
    title: makeTitle(m.name),
    description: makeDescription(m.name),
    keywords: [`used ${m.name} for sale`, `second hand ${m.name}`, `${m.name} dealer Sydney`],
    thin: { total: await getVehicleCount({ make: m.slug }), kind: "makeModel" },
  });
}

export default async function MakeOrBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  const [{ make }, sp] = await Promise.all([params, searchParams]);
  const budget = parseBudget(make);

  if (budget) {
    const path = `/used-cars/under-${budget}`;
    return (
      <>
        <JsonLd
          schema={collectionPageSchema({
            name: budgetTitle(budget),
            description: budgetDescription(budget),
            path,
          })}
        />
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ListingBreadcrumbs
            trail={[["Used Cars", "/used-cars"], [`Under ${formatPrice(budget)}`, path]]}
          />
          <header className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-foreground">Used cars under {formatPrice(budget)}</h1>
            <p className="mt-2 max-w-2xl text-body">
              Great value, fully inspected cars that fit your budget. Every car under {formatPrice(budget)} here is
              ready to drive away, with finance and trade-ins available.
            </p>
          </header>
          <InventoryListingView baseFilters={{ priceMax: budget }} sp={sp} basePath={path} />
        </main>
        <SiteFooter />
      </>
    );
  }

  const m = await resolveMake(make);
  if (!m) notFound();

  const path = `/used-cars/${m.slug}`;
  return (
    <>
      <JsonLd
        schema={collectionPageSchema({
          name: makeTitle(m.name),
          description: makeDescription(m.name),
          path,
        })}
      />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ListingBreadcrumbs trail={[["Used Cars", "/used-cars"], [m.name, path]]} />
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used {m.name} for sale</h1>
          <p className="mt-2 max-w-2xl text-body">
            Explore our range of quality used {m.name}{" "}vehicles. Each one is inspected by our team, honestly
            photographed, and backed by a specialist who&apos;ll answer your questions fast.
          </p>
        </header>
        <InventoryListingView baseFilters={{ make: m.slug }} sp={sp} basePath={path} hideFilters={["make"]} />
      </main>
      <SiteFooter />
    </>
  );
}
