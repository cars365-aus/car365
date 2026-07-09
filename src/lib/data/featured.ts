import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/lib/types";
import { resolveVehicleImage, type VehicleImageRecord } from "@/lib/image-utils";
import { computeSuperHost } from "@/lib/vehicle-badges";

/**
 * Active featured-placement vehicles as fully-populated `Vehicle` objects so
 * the homepage renders the same rich card as search (real specs, ratings,
 * features, vendor logo, trust flags — never fabricated).
 */
export const getActiveFeaturedVehicles = unstable_cache(
  async function getActiveFeaturedVehicles(city?: string | null): Promise<Vehicle[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("featured_placements")
    .select(`
      id, city, vehicle_id,
      vehicles!inner(
        id, slug, title, make, model, year, seats, fuel, transmission, category,
        price_per_day_aud, weekly_rate_aud, monthly_rate_aud, daily_distance_limit_km,
        extra_distance_fee_aud, instant_book, status,
        branches!inner(name, city, state, status),
        organizations!inner(name, slug, status, logo_url, verified_at),
        vehicle_images(storage_path, approved, sort_order),
        vehicle_features(feature)
      )
    `)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .eq("vehicles.status", "approved")
    .eq("vehicles.branches.status", "approved")
    .eq("vehicles.organizations.status", "approved");

  if (city) {
    query = query.or(`city.is.null,city.ilike.${city}`);
  }

  const { data, error } = await query.limit(12);

  if (error || !data) {
    return [];
  }

  type VehicleRow = {
    id: string;
    slug: string;
    title: string;
    make: string;
    model: string;
    year: number;
    seats: number;
    fuel: string;
    transmission: string;
    category: string;
    price_per_day_aud: number;
    weekly_rate_aud: number | null;
    monthly_rate_aud: number | null;
    daily_distance_limit_km: number | null;
    extra_distance_fee_aud: number | null;
    instant_book: boolean;
    branches: { name: string; city: string; state: string };
    organizations: { name: string; slug: string; logo_url: string | null; verified_at: string | null };
    vehicle_images?: VehicleImageRecord[] | null;
    vehicle_features?: { feature: string }[] | null;
  };

  const rows = data.map((row) => row.vehicles as unknown as VehicleRow);

  // Batch-load approved-review aggregates for all featured vehicles.
  const ratingInfo: Record<string, { avg: number; count: number }> = {};
  if (rows.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("vehicle_id, rating")
      .in("vehicle_id", rows.map((v) => v.id))
      .eq("status", "approved");
    const sums: Record<string, { total: number; count: number }> = {};
    for (const r of reviews ?? []) {
      if (!r.vehicle_id) continue;
      if (!sums[r.vehicle_id]) sums[r.vehicle_id] = { total: 0, count: 0 };
      sums[r.vehicle_id].total += r.rating;
      sums[r.vehicle_id].count += 1;
    }
    for (const [id, s] of Object.entries(sums)) {
      ratingInfo[id] = { avg: s.total / s.count, count: s.count };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return rows.map((v) => {
    const verified = v.organizations.verified_at != null;
    const rating = ratingInfo[v.id];
    const avgRating = rating?.avg ?? null;
    const reviewCount = rating?.count ?? 0;

    return {
      id: v.id,
      slug: v.slug,
      title: v.title,
      make: v.make,
      model: v.model,
      year: v.year,
      seats: v.seats,
      fuel: v.fuel,
      transmission: v.transmission,
      category: v.category,
      pricePerDayAud: v.price_per_day_aud,
      weeklyRateAud: v.weekly_rate_aud,
      monthlyRateAud: v.monthly_rate_aud,
      dailyDistanceLimitKm: v.daily_distance_limit_km,
      extraDistanceFeeAud: v.extra_distance_fee_aud,
      instantBook: v.instant_book,
      city: v.branches.city,
      state: v.branches.state,
      imageUrl: resolveVehicleImage(supabaseUrl, v.vehicle_images ?? [], v.category),
      vendorName: v.organizations.name,
      vendorSlug: v.organizations.slug,
      branchName: v.branches.name,
      verified,
      vendorLogoUrl: v.organizations.logo_url,
      avgRating,
      reviewCount,
      features: (v.vehicle_features ?? []).map((f) => f.feature),
      freeDelivery: false,
      freeCancellation: false,
      noHiddenFees: false,
      superHost: computeSuperHost({ verified, avgRating, reviewCount }),
    } satisfies Vehicle;
  });
}, ["featured-vehicles"], { revalidate: 3600, tags: ["featured"] });

export type HomeTestimonial = {
  id: string;
  author: string;
  location: string;
  quote: string;
  rating: number;
};

/**
 * Returns genuine, approved customer reviews for use as homepage testimonials.
 * Only reviews that passed moderation (status = "approved") on approved
 * organizations are eligible, and only ratings of 4-5. Never fabricates data:
 * if there are no qualifying reviews the homepage simply hides the section.
 */
export const getApprovedTestimonials = unstable_cache(
  async function getApprovedTestimonials(limit = 4): Promise<HomeTestimonial[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, customer_name, rating, body, created_at,
      organizations!inner(name, status, branches(city, status))
    `)
    .eq("status", "approved")
    .gte("rating", 4)
    .eq("organizations.status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  type ReviewRow = {
    id: string;
    customer_name: string | null;
    rating: number;
    body: string | null;
    organizations: {
      name: string;
      branches?: { city: string | null; status: string }[] | null;
    } | null;
  };

  const results: HomeTestimonial[] = [];

  for (const row of data as unknown as ReviewRow[]) {
    if (!row.body || !row.customer_name) continue;

    const org = row.organizations;
    const approvedBranch = org?.branches?.find((b) => b.status === "approved" && b.city);
    const location = approvedBranch?.city ?? org?.name ?? "Australia";

    results.push({
      id: row.id,
      author: row.customer_name,
      location,
      quote: row.body,
      rating: row.rating,
    });
  }

  return results;
}, ["approved-testimonials"], { revalidate: 3600, tags: ["testimonials", "reviews"] });

export type MarketplaceStats = {
  operatorCount: number;
  cityCount: number;
  vehicleCount: number;
};

/**
 * Returns live, provable marketplace counts derived only from approved records.
 * Used to render honest homepage stats. Returns zeros on error so the caller
 * can decide whether to show a stat or fall back to a qualitative claim.
 */
export const getMarketplaceStats = unstable_cache(
  async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const supabase = createAdminClient();

  const [{ count: operatorCount }, vehicleResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("vehicles")
      .select("id, branches!inner(city, status)", { count: "exact" })
      .eq("status", "approved")
      .eq("branches.status", "approved"),
  ]);

  const cities = new Set<string>();
  type CityRow = { branches?: { city: string | null } | null };
  (vehicleResult.data as unknown as CityRow[] | null)?.forEach((row) => {
    const city = row.branches?.city;
    if (city) cities.add(city.toLowerCase());
  });

  return {
    operatorCount: operatorCount ?? 0,
    cityCount: cities.size,
    vehicleCount: vehicleResult.count ?? 0,
  };
}, ["marketplace-stats"], { revalidate: 3600, tags: ["stats", "vehicles", "organizations"] });
