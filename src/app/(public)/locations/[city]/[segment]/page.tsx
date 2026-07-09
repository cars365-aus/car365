import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { CityCategoryHub } from "@/components/pseo/city-category-hub";
import { searchVehicles } from "@/lib/search/typesense";
import {
  isCategorySlug,
  slugToCategory,
  slugToDisplayBrand,
  brandCityTitle,
  brandCityDescription,
  brandRobots,
  cityCategoryRobots,
  buildBreadcrumbSchema,
  buildItemListSchema,
  serializeSchemas,
  getCityMeta,
  cityCategoryTitle,
  cityCategoryDescription,
} from "@/lib/seo";
import { getIndexableSitemapUrls } from "@/lib/seo/discovery";
import { Filter, Tag } from "lucide-react";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { cityCategoryUrls } = await getIndexableSitemapUrls();
  return cityCategoryUrls.map((url) => {
    // url is like /locations/sydney/suv
    const parts = url.split("/");
    return {
      city: parts[2],
      segment: parts[3],
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; segment: string }>;
}): Promise<Metadata> {
  const { city, segment } = await params;

  if (isCategorySlug(segment)) {
    const category = slugToCategory(segment)!;
    const meta = getCityMeta(city);
    const { total, vehicles } = await searchVehicles("", { city: meta.title, category }, { page: 1, perPage: 24 });
    const lowestPrice = vehicles.length > 0 ? Math.min(...vehicles.map(v => v.pricePerDayAud)) : undefined;

    return {
      title: cityCategoryTitle(city, category, meta.state, lowestPrice),
      description: cityCategoryDescription(city, category, total, meta.state),
      openGraph: {
        title: cityCategoryTitle(city, category, meta.state, lowestPrice),
        description: cityCategoryDescription(city, category, total, meta.state),
      },
      alternates: { canonical: `/locations/${city}/${segment}` },
      robots: cityCategoryRobots(total),
    };
  }

  const displayCity = getCityMeta(city).title;
  const displayBrand = slugToDisplayBrand(segment);
  const { total } = await searchVehicles("", { city: displayCity, make: displayBrand }, { page: 1, perPage: 1 });

  return {
    title: brandCityTitle(displayBrand, city),
    description: brandCityDescription(displayBrand, city),
    openGraph: {
      title: brandCityTitle(displayBrand, city),
      description: brandCityDescription(displayBrand, city),
    },
    alternates: { canonical: `/locations/${city}/${segment}` },
    robots: brandRobots(total),
  };
}

async function BrandCityPage({
  city,
  segment,
}: {
  city: string;
  segment: string;
}) {
  const meta = getCityMeta(city);
  const displayCity = meta.title;
  const displayBrand = slugToDisplayBrand(segment);

  const { vehicles, total } = await searchVehicles(
    "",
    { city: displayCity, make: displayBrand },
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
      { name: displayCity, path: `/locations/${city}` },
      { name: displayBrand, path: `/locations/${city}/${segment}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
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
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/locations/${city}`} className="hover:text-white transition-colors">{displayCity}</Link>
              <span>/</span>
              <span className="text-white font-medium">{displayBrand}</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold text-sm">Verified Vehicles</span>
                </div>
                <h1 className="text-4xl font-black text-white sm:text-5xl">
                  {displayBrand} for hire in {displayCity}
                </h1>
                <p className="mt-3 text-slate-300 max-w-lg">
                  {total > 0
                    ? `Compare ${total} ${displayBrand} vehicles from local operators.`
                    : `Explore ${displayBrand} rental cars from verified local companies.`}
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
                  href={`/search?city=${encodeURIComponent(displayCity)}&make=${encodeURIComponent(displayBrand)}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title={`No ${displayBrand} vehicles found in ${displayCity}`}
              description={`We couldn't find any ${displayBrand} rental cars in this location.`}
              actionLabel={`View all cars in ${displayCity}`}
              actionHref={`/locations/${city}`}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function LocationSegmentPage({
  params,
}: {
  params: Promise<{ city: string; segment: string }>;
}) {
  const { city, segment } = await params;

  if (isCategorySlug(segment)) {
    return <CityCategoryHub citySlug={city.toLowerCase()} categorySlug={segment.toLowerCase()} />;
  }

  return <BrandCityPage city={city.toLowerCase()} segment={segment.toLowerCase()} />;
}
