import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const getCachedVehicleDetails = unstable_cache(
  async function getCachedVehicleDetails(slug: string) {
    const supabase = createAdminClient();

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select(`
        id, slug, title, make, model, year, seats, fuel, transmission, category,
        price_per_day_aud, daily_distance_limit_km, extra_distance_fee_aud, instant_book, status, organization_id, views_count,
        organizations(id, name, slug, status, verified_at),
        branches(name, city, state, status, phone, whatsapp),
        vehicle_images(id, storage_path, alt_text, sort_order, approved),
        vehicle_features(feature)
      `)
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (!vehicle) {
      return null;
    }

    const [vendorSubRes, reviewsRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_code, status")
        .eq("organization_id", vehicle.organization_id)
        .in("status", ["active", "trialing"])
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("id, customer_name, rating, body, created_at")
        .eq("organization_id", vehicle.organization_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

    return {
      vehicle,
      vendorSub: vendorSubRes.data,
      reviews: reviewsRes.data ?? []
    };
  },
  ["public-vehicle-details"],
  { revalidate: 3600, tags: ["vehicles", "public"] }
);

export const getCachedVehicleMetadata = unstable_cache(
  async function getCachedVehicleMetadata(slug: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("vehicles")
      .select("title, make, model, year, category, price_per_day_aud, vehicle_images(storage_path, approved, sort_order), branches(city, state)")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    return data;
  },
  ["public-vehicle-metadata"],
  { revalidate: 3600, tags: ["vehicles", "public"] }
);
