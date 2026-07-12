import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InventoryListingView } from "@/components/inventory-listing-view";
import { getMakes } from "@/lib/data/inventory";
import { formatPrice } from "@/lib/nav";

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

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { make } = await params;
  const budget = parseBudget(make);
  if (budget) {
    return {
      title: `Used Cars Under ${formatPrice(budget)}`,
      description: `Browse quality used cars for sale under ${formatPrice(budget)}. Inspected, priced honestly, finance available.`,
    };
  }
  const m = await resolveMake(make);
  if (!m) return { title: "Used Cars" };
  return {
    title: `Used ${m.name} for Sale`,
    description: `Browse our range of quality used ${m.name} vehicles for sale. Inspected, priced honestly, with finance and trade-ins available.`,
  };
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
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Breadcrumbs trail={[["Used Cars", "/used-cars"], [`Under ${formatPrice(budget)}`, null]]} />
          <header className="mb-6">
            <h1 className="font-heading text-3xl font-bold text-foreground">Used cars under {formatPrice(budget)}</h1>
            <p className="mt-2 max-w-2xl text-body">
              Great value, fully inspected cars that fit your budget. Every car under {formatPrice(budget)} here is
              ready to drive away, with finance and trade-ins available.
            </p>
          </header>
          <InventoryListingView baseFilters={{ priceMax: budget }} sp={sp} basePath={`/used-cars/under-${budget}`} />
        </main>
        <SiteFooter />
      </>
    );
  }

  const m = await resolveMake(make);
  if (!m) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumbs trail={[["Used Cars", "/used-cars"], [m.name, null]]} />
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Used {m.name} for sale</h1>
          <p className="mt-2 max-w-2xl text-body">
            Explore our range of quality used {m.name}{" "}vehicles. Each one is inspected by our team, honestly
            photographed, and backed by a specialist who&apos;ll answer your questions fast.
          </p>
        </header>
        <InventoryListingView baseFilters={{ make: m.slug }} sp={sp} basePath={`/used-cars/${m.slug}`} hideFilters={["make"]} />
      </main>
      <SiteFooter />
    </>
  );
}

function Breadcrumbs({ trail }: { trail: [string, string | null][] }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">Home</Link>
      {trail.map(([label, href], i) => (
        <span key={i} className="flex gap-1.5">
          <span aria-hidden>/</span>
          {href ? <Link href={href} className="hover:text-foreground">{label}</Link> : <span className="text-foreground">{label}</span>}
        </span>
      ))}
    </nav>
  );
}
