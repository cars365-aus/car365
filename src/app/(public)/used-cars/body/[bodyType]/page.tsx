import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { parseBodySegment, BODY_TYPE_LABELS } from "@/lib/nav";

export const revalidate = 300;

type Params = { bodyType: string };
type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { bodyType } = await params;
  const b = parseBodySegment(bodyType);
  if (!b) return { title: "Used Cars" };
  return {
    title: `Used ${BODY_TYPE_LABELS[b]} for Sale`,
    description: `Browse quality used ${BODY_TYPE_LABELS[b]} vehicles for sale — inspected, honestly priced, with finance and trade-ins available.`,
  };
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span aria-hidden>/</span>
          <Link href="/used-cars" className="hover:text-foreground">Used Cars</Link><span aria-hidden>/</span>
          <span className="text-foreground">{label}</span>
        </nav>
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used {label} for sale</h1>
          <p className="mt-2 max-w-2xl text-body">
            Browse our range of quality used {label.toLowerCase()} vehicles. Each one is inspected, honestly
            photographed, and ready to drive away — with finance and trade-ins available.
          </p>
        </header>
        <InventoryListingView baseFilters={{ bodyType: b }} sp={sp} basePath={`/used-cars/body/${bodyType}`} hideFilters={["body"]} />
      </main>
      <SiteFooter />
    </>
  );
}
