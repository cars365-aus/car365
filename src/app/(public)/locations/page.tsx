import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCitiesWithCounts } from "@/lib/seo/discovery";
import { MapPin, Car, ArrowRight, Search } from "lucide-react";

export const metadata = {
  title: "Car Hire Locations | Australia",
  description:
    "Find affordable car hire across Australia. Browse vehicle rentals by city from verified local operators.",
};

const CITY_EMOJI: Record<string, string> = {
  Sydney: "🌉",
  Melbourne: "☕",
  Brisbane: "☀️",
  Perth: "🌅",
  Adelaide: "🍷",
  "Gold Coast": "🏄",
  Cairns: "🐠",
  Darwin: "🌿",
  Hobart: "🏔️",
  Canberra: "🏛️",
  Newcastle: "⚓",
  Wollongong: "🌊",
};

export default async function LocationsPage() {
  const cities = await getCitiesWithCounts();
  const totalVehicles = cities.reduce((sum, c) => sum + c.vehicleCount, 0);
  const totalCities = cities.length;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Australia-wide coverage</span>
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Find car hire near you
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Compare vehicles from verified local operators across Australia.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              {[
                { value: totalVehicles || "0", label: "Vehicles available" },
                { value: totalCities || "0", label: "Cities covered" },
                { value: "100%", label: "Verified operators" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Browse by city</h2>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              Advanced search
            </Link>
          </div>

          {cities.length === 0 ? (
            <p className="text-slate-500 text-center py-12">
              Cities will appear here as vendors list vehicles.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cities.map(({ city, state, slug, vehicleCount, operatorCount }) => {
                const hasVehicles = vehicleCount > 0;
                return (
                  <Link
                    key={slug}
                    href={`/locations/${slug}`}
                    className={`group relative rounded-3xl border p-6 transition-all duration-200 hover:shadow-lg ${
                      hasVehicles
                        ? "border-slate-200 bg-white hover:border-amber-300 hover:-translate-y-0.5"
                        : "border-slate-100 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-3xl">{CITY_EMOJI[city] ?? "📍"}</span>
                      {state && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            hasVehicles
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {state}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                      {city}
                    </h3>

                    <div className="flex items-center gap-4 text-sm mt-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Car className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">{vehicleCount}</span> vehicles
                      </span>
                      {operatorCount > 0 && (
                        <span className="text-slate-400 text-xs">
                          {operatorCount} operator{operatorCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div
                      className={`mt-4 flex items-center gap-1 text-xs font-semibold transition-colors ${
                        hasVehicles ? "text-amber-600 group-hover:text-amber-700" : "text-slate-400"
                      }`}
                    >
                      {hasVehicles ? "Browse vehicles" : "Coming soon"}
                      {hasVehicles && <ArrowRight className="h-3.5 w-3.5" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-amber-50 border-y border-amber-200 py-12 text-center px-4">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black text-slate-900">Don&apos;t see your city?</h2>
            <p className="mt-2 text-slate-600 text-sm">
              New cities appear automatically when vendors add branches and list vehicles.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              Search all vehicles
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
