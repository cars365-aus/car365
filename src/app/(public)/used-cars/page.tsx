import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";

export const metadata: Metadata = {
  title: "Used Cars for Sale",
  description: "Browse our full range of quality, inspected used cars for sale. Filter by make, model, body type, price and more.",
};

export const revalidate = 60;

type SP = Record<string, string | string[] | undefined>;

export default async function UsedCarsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 lg:pt-12">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span>{" "}
          <span className="text-foreground">Used Cars</span>
        </nav>
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used cars for sale</h1>
          <p className="mt-1 text-body">Quality, inspected cars ready to drive away.</p>
        </header>
        <InventoryListingView baseFilters={{}} sp={sp} basePath="/used-cars" />
      </main>
      <SiteFooter />
    </>
  );
}
