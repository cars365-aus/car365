import Link from "next/link";
// notFound removed
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { searchVehicles } from "@/lib/search/typesense";
import { MapPin, Car, ArrowLeft, Filter } from "lucide-react";
import type { Metadata } from "next";
import {
  getCityMeta,
  cityTitle,
  cityDescription,
  cityRobots,
  categoryToSlug,
  VEHICLE_CATEGORIES,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
  serializeSchemas,
} from "@/lib/seo";
import { getIndexableSitemapUrls, getCitiesWithCounts } from "@/lib/seo/discovery";
import { cityToSlug } from "@/lib/seo/slugs";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { cityUrls } = await getIndexableSitemapUrls();
  return cityUrls.map((url) => ({
    city: url.replace("/locations/", ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const slug = city.toLowerCase();
  const meta = getCityMeta(slug);
  const searchCity = meta.title;

  const { total, vehicles } = await searchVehicles("", { city: searchCity }, { page: 1, perPage: 24 });
  const lowestPrice = vehicles.length > 0 ? Math.min(...vehicles.map(v => v.pricePerDayAud)) : undefined;

  return {
    title: cityTitle(slug, meta.state, lowestPrice),
    description: cityDescription(slug, meta.state),
    openGraph: {
      title: cityTitle(slug, meta.state, lowestPrice),
      description: cityDescription(slug, meta.state),
    },
    alternates: { canonical: `/locations/${slug}` },
    robots: cityRobots(total),
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const slug = city.toLowerCase();
  const meta = getCityMeta(slug);
  const searchCity = meta.title;

  // Fetch vehicles via search and other cities for internal linking
  const [{ vehicles, total }, allCities] = await Promise.all([
    searchVehicles("", { city: searchCity }, { page: 1, perPage: 24 }),
    getCitiesWithCounts()
  ]);

  const displayCity = meta.title;
  const state = meta.state;

  // Category breakdown from results
  const categories = Array.from(new Set(vehicles.map((v) => v.category))).slice(0, 4);
  const priceRange =
    vehicles.length > 0
      ? {
          min: Math.min(...vehicles.map((v) => v.pricePerDayAud)),
          max: Math.max(...vehicles.map((v) => v.pricePerDayAud)),
        }
      : null;

  const avgPrice =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((acc, v) => acc + v.pricePerDayAud, 0) / vehicles.length)
      : null;

  const nearbyCities = allCities
    .filter(c => c.state === state && c.slug !== slug)
    .sort((a, b) => b.vehicleCount - a.vehicleCount)
    .slice(0, 10);

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: displayCity, path: `/locations/${slug}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema([
      {
        question: `What is the average cost of car hire in ${displayCity}?`,
        answer: avgPrice
          ? `Based on active listings, the average car hire in ${displayCity} costs $${avgPrice} AUD per day.`
          : `Car hire prices in ${displayCity} vary based on season and vehicle type.`,
      },
    ]),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(schemas) }}
      />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-950 to-slate-800 px-4 py-8 lg:py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
              <Link href="/" className="hover:text-white transition-colors shrink-0">Home</Link>
              <span className="shrink-0">/</span>
              <Link href="/locations" className="hover:text-white transition-colors shrink-0">Locations</Link>
              <span className="shrink-0">/</span>
              <span className="text-white font-medium shrink-0">{displayCity}</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold text-sm">{state}</span>
                </div>
                <h1 className="text-4xl font-black text-white sm:text-5xl">
                  Car hire in {displayCity}
                </h1>
                <p className="mt-3 text-slate-300 max-w-lg">
                  {total > 0
                    ? `${total} vehicle${total !== 1 ? "s" : ""} from verified local operators`
                    : "Explore vehicles from verified local rental companies"}
                </p>
              </div>

              {total > 0 && priceRange && (
                <div className="rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-center shrink-0">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">From</p>
                  <p className="text-3xl font-black text-white">${priceRange.min}</p>
                  <p className="text-xs text-slate-400">AUD / day</p>
                </div>
              )}
            </div>

            {/* Quick stats */}
            {total > 0 && (
              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Car className="h-4 w-4 text-amber-400" />
                  <span><span className="font-bold text-white">{total}</span> listings</span>
                </div>
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Filter className="h-4 w-4 text-amber-400" />
                    <span>{categories.join(" · ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* AI Answer Block / Market Insights */}
        {total > 0 && avgPrice && (
          <section className="mx-auto max-w-7xl px-4 py-6 lg:py-8 sm:px-6 lg:px-8 border-b border-slate-200">
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-1 lg:mb-2">Market Insights: {displayCity}</h2>
            <p className="text-slate-600">
              Based on {total} active listings on Hire Car, the average daily car rental in {displayCity} costs <strong>${avgPrice} AUD per day</strong>. 
              {priceRange && ` Prices range from $${priceRange.min} to $${priceRange.max} depending on vehicle class and rental operator.`}
            </p>
          </section>
        )}

        {/* Results */}
        <section className="mx-auto max-w-7xl px-4 py-6 lg:py-10 sm:px-6 lg:px-8">
          {vehicles.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-900">{vehicles.length}</span> of{" "}
                  <span className="font-bold text-slate-900">{total}</span> vehicles
                </p>
                <Link
                  href={`/search?city=${encodeURIComponent(searchCity)}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Refine with filters →
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3} />
                ))}
              </div>

              {total > 24 && (
                <div className="mt-10 text-center">
                  <Link
                    href={`/search?city=${encodeURIComponent(searchCity)}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    View all {total} vehicles <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={`No vehicles listed in ${displayCity} yet`}
              description="We don't have any verified listings here yet. Try searching nearby cities or browse all available locations."
              actionHref="/locations"
              actionLabel="Browse all locations"
            />
          )}
        </section>

        {/* SEO text footer */}
        {total > 0 && (
          <section className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Car hire in {displayCity}, {state}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hire Car connects you directly with verified local rental operators in {displayCity}. All vendors are
                verified with ABN validation and go through an approval process before listing. There are no booking
                fees — you contact the operator directly to arrange dates, pricing, and pickup. Browse by category,
                fuel type, or price to find the right vehicle for your trip.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {VEHICLE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/locations/${slug}/${categoryToSlug(cat)}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                  >
                    {cat} hire in {displayCity}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Nearby Cities (Internal Linking Hub) */}
        {nearbyCities.length > 0 && (
          <section className="bg-slate-50 border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                Other locations in {state}
              </h2>
              <div className="flex flex-wrap gap-3">
                {nearbyCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/locations/${c.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-amber-300 hover:text-amber-700 transition-colors"
                  >
                    Car hire {c.city} <span className="text-slate-400 ml-1">({c.vehicleCount})</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
