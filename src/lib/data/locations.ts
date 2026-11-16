/* eslint-disable @typescript-eslint/no-explicit-any --
   Untyped Supabase client: rows are shaped into typed projections here. */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LocationBranch } from "@/lib/domain";

export const DEFAULT_LANSVALE_BRANCH: LocationBranch = {
  id: "lansvale-branch",
  name: "Lansvale Branch",
  slug: "lansvale-branch",
  address: "16 Hollywood Dr",
  city: "Lansvale",
  state: "NSW",
  postcode: "2166",
  phone: null,
  whatsapp: null,
  lat: -33.8967,
  lng: 150.9634,
  hours: {
    mon: "9:00-18:00",
    tue: "9:00-18:00",
    wed: "9:00-18:00",
    thu: "9:00-18:00",
    fri: "9:00-18:00",
    sat: "9:00-17:00",
    sun: "closed",
  },
};

function normalizeLocationBranch(l: any): LocationBranch {
  const isCars365GranvilleBranch =
    l.address?.toLowerCase().includes("93 parramatta") ||
    (l.address?.toLowerCase().includes("parramatta") && (l.city?.toLowerCase() === "granville" || l.postcode === "2142")) ||
    l.name?.toLowerCase() === "granville branch" ||
    l.slug === "granville" ||
    l.slug === "granville-branch";

  if (isCars365GranvilleBranch) {
    return {
      id: l.id,
      name: "Lansvale Branch",
      slug: l.slug === "granville" || l.slug === "granville-branch" ? "lansvale-branch" : l.slug,
      address: "16 Hollywood Dr",
      city: "Lansvale",
      state: "NSW",
      postcode: "2166",
      phone: l.phone ?? null,
      whatsapp: l.whatsapp ?? null,
      lat: l.lat ?? -33.8967,
      lng: l.lng ?? 150.9634,
      hours: l.hours ?? {},
    };
  }

  return {
    id: l.id,
    name: l.name,
    slug: l.slug,
    address: l.address,
    city: l.city,
    state: l.state,
    postcode: l.postcode ?? null,
    phone: l.phone ?? null,
    whatsapp: l.whatsapp ?? null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
    hours: l.hours ?? {},
  };
}

export const getActiveLocations = unstable_cache(
  async (): Promise<LocationBranch[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, slug, address, city, state, postcode, phone, whatsapp, lat, lng, hours")
      .eq("is_active", true)
      .order("name");
    const rows = ((data ?? []) as any[]).map(normalizeLocationBranch);
    return rows.length > 0 ? rows : [DEFAULT_LANSVALE_BRANCH];
  },
  ["active-locations"],
  { revalidate: 3600, tags: ["locations", "public"] },
);
