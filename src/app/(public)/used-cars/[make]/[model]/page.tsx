import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { getMakes, getModelsForMake } from "@/lib/data/inventory";

export const revalidate = 300;

type Params = { make: string; model: string };
type SP = Record<string, string | string[] | undefined>;

async function resolve(makeSlug: string, modelSlug: string) {
  const [makes, models] = await Promise.all([getMakes(), getModelsForMake(makeSlug)]);
  const make = makes.find((m) => m.slug === makeSlug) ?? null;
  const model = models.find((m) => m.slug === modelSlug) ?? null;
  return { make, model };
}

import { makeModelTitle, makeModelDescription } from "@/lib/seo/templates";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { make, model } = await params;
  const r = await resolve(make, model);
  if (!r.make || !r.model) return { title: "Used Cars" };
  return {
    title: makeModelTitle(r.make.name, r.model.name),
    description: makeModelDescription(r.make.name, r.model.name),
  };
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span aria-hidden>/</span>
          <Link href="/used-cars" className="hover:text-foreground">Used Cars</Link><span aria-hidden>/</span>
          <Link href={`/used-cars/${mk.slug}`} className="hover:text-foreground">{mk.name}</Link><span aria-hidden>/</span>
          <span className="text-foreground">{md.name}</span>
        </nav>
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
          basePath={`/used-cars/${mk.slug}/${md.slug}`}
          hideFilters={["make"]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
