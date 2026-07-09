import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/empty-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { MapPin, Car, Star, Building2, BadgeCheck } from "lucide-react";

export const metadata = {
  title: "Rental Operators Directory | Hire Car",
  description: "Browse our directory of verified local car rental operators across Australia. Find trusted businesses, read reviews, and explore their fleets.",
};

export default async function VendorsDirectoryPage() {
  const supabase = createAdminClient();

  // Fetch all approved organizations with their branches, vehicle counts, and reviews
  // Note: We use raw queries here as PostgREST can sometimes struggle with complex aggregates,
  // but a simplified query works well enough.
  const { data: orgs } = await supabase
    .from("organizations")
    .select(`
      id, name, slug, verified_at,
      branches(city, state, status),
      vehicles(id, status),
      reviews(rating, status)
    `)
    .eq("status", "approved")
    .order("name", { ascending: true });

  const vendors = (orgs ?? []).map((org) => {
    type BranchData = { city: string; state: string; status: string };
    type VehicleData = { id: string; status: string };
    type ReviewData = { rating: number; status: string };

    const branches = (org.branches as unknown as BranchData[]).filter(b => b.status === "approved");
    const activeVehicles = (org.vehicles as unknown as VehicleData[]).filter(v => v.status === "approved");
    const approvedReviews = (org.reviews as unknown as ReviewData[]).filter(r => r.status === "approved");

    const averageRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : null;

    // Use primary branch for location (or empty)
    const primaryBranch = branches[0];

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isVerified: !!org.verified_at,
      vehicleCount: activeVehicles.length,
      city: primaryBranch?.city,
      state: primaryBranch?.state,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      reviewCount: approvedReviews.length,
    };
  });

  // Sort vendors by rating (desc), then by vehicle count (desc)
  vendors.sort((a, b) => {
    if (a.averageRating !== b.averageRating) {
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    }
    return b.vehicleCount - a.vehicleCount;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-5">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Verified Operators</span>
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Local Rental Operators
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Browse our directory of verified, independent car rental businesses across Australia.
            </p>
          </div>
        </section>

        {/* Directory Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              All Operators <span className="text-slate-400 font-medium text-lg ml-2">({vendors.length})</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.slug}`}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                      {vendor.name}
                      {vendor.isVerified && (
                        <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                    </h3>
                    
                    <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-500">
                      {vendor.city && vendor.state ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {vendor.city}, {vendor.state}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          Australia
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Car className="h-4 w-4 text-slate-400" />
                    {vendor.vehicleCount} vehicle{vendor.vehicleCount !== 1 ? "s" : ""}
                  </span>

                  {vendor.averageRating !== null ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {vendor.averageRating.toFixed(1)}
                      <span className="text-slate-400 font-normal ml-0.5">({vendor.reviewCount})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No reviews yet</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {vendors.length === 0 && (
            <EmptyState
              icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
              title="No operators found"
              description="Check back later for newly verified operators."
              actionLabel="Search vehicles"
              actionHref="/search"
            />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
