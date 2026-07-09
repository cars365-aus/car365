import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { searchVehicles } from "@/lib/search/typesense";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
  serializeSchemas,
  cityCategoryDescription,
  getCityMeta,
  slugToCategory,
} from "@/lib/seo";
import { Filter, Car } from "lucide-react";

export const revalidate = 3600;

interface CityCategoryHubProps {
  citySlug: string;
  categorySlug: string;
}

export async function CityCategoryHub({ citySlug, categorySlug }: CityCategoryHubProps) {
  const category = slugToCategory(categorySlug);
  if (!category) return null;

  const meta = getCityMeta(citySlug);
  const searchCity = meta.title;
  const { vehicles, total } = await searchVehicles(
    "",
    { city: searchCity, category },
    { page: 1, perPage: 24 },
  );

  const avgPrice =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((acc, v) => acc + v.pricePerDayAud, 0) / vehicles.length)
      : null;

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: searchCity, path: `/locations/${citySlug}` },
      { name: category, path: `/locations/${citySlug}/${categorySlug}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema([
      {
        question: `How much does ${category} hire cost in ${searchCity}?`,
        answer: avgPrice
          ? `Based on active listings, ${category} hire in ${searchCity} averages $${avgPrice} AUD per day on Hire Car.`
          : `${category} hire prices in ${searchCity} vary by operator and season.`,
      },
      {
        question: `How do I book a ${category} in ${searchCity}?`,
        answer: `Browse listings on Hire Car, send an enquiry to the vendor, and arrange pickup directly. There are no platform booking fees.`,
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
        <section className="bg-gradient-to-b from-slate-950 to-slate-800 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 overflow-x-auto">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
              <span>/</span>
              <Link href={`/locations/${citySlug}`} className="hover:text-white transition-colors">
                {searchCity}
              </Link>
              <span>/</span>
              <span className="text-white font-medium">{category}</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-5 w-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold text-sm">{meta.state}</span>
                </div>
                <h1 className="text-4xl font-black text-white sm:text-5xl">
                  {category} hire in {searchCity}
                </h1>
                <p className="mt-3 text-slate-300 max-w-lg">
                  {cityCategoryDescription(citySlug, category, total, meta.state)}
                </p>
              </div>
              {avgPrice && (
                <div className="rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-center shrink-0">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Avg Price</p>
                  <p className="text-3xl font-black text-white">${avgPrice}</p>
                  <p className="text-xs text-slate-400">AUD / day</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {vehicles.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-900">{vehicles.length}</span> of{" "}
                  <span className="font-bold text-slate-900">{total}</span> vehicles
                </p>
                <Link
                  href={`/search?city=${encodeURIComponent(searchCity)}&category=${encodeURIComponent(category)}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title={`No ${category} vehicles in ${searchCity} yet`}
              description="Try browsing all vehicles in this city or explore other categories."
              actionHref={`/locations/${citySlug}`}
              actionLabel={`View all in ${searchCity}`}
            />
          )}
        </section>

        {total > 0 && (
          <section className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                {category} rental in {searchCity}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Hire Car lists verified {category} vehicles from independent operators in {searchCity}.
                Compare daily rates, contact vendors directly, and arrange pickup without platform booking fees.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/categories/${categorySlug}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {category} hire Australia-wide
                </Link>
                <Link
                  href={`/locations/${citySlug}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  All vehicles in {searchCity}
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

