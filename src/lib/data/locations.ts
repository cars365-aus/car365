/* eslint-disable @typescript-eslint/no-explicit-any --
   Untyped Supabase client: rows are shaped into typed projections here. */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LocationBranch } from "@/lib/domain";

export const getActiveLocations = unstable_cache(
  async (): Promise<LocationBranch[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, slug, address, city, state, postcode, phone, whatsapp, lat, lng, hours")
      .eq("is_active", true)
      .order("name");
    return ((data ?? []) as any[]).map((l) => ({
      id: l.id, name: l.name, slug: l.slug, address: l.address, city: l.city,
      state: l.state, postcode: l.postcode ?? null, phone: l.phone ?? null,
      whatsapp: l.whatsapp ?? null, lat: l.lat ?? null, lng: l.lng ?? null,
      hours: l.hours ?? {},
    }));
  },
  ["active-locations"],
  { revalidate: 3600, tags: ["locations", "public"] },
);
