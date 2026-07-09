import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { VEHICLE_CATEGORIES, categoryToSlug, type VehicleCategory } from "./categories";
import { cityToSlug } from "./slugs";
import {
  isIndexableCity,
  isIndexableCityCategory,
  isIndexableCategoryNational,
} from "./guards";

type VehicleRow = {
  category: string;
  branches: { city: string; state: string; status: string } | null;
};

const getCachedApprovedVehiclesWithBranches = unstable_cache(
  async (): Promise<VehicleRow[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("vehicles")
      .select("category, branches!inner(city, state, status)")
      .eq("status", "approved")
      .eq("branches.status", "approved");

    return (data ?? []) as unknown as VehicleRow[];
  },
  ["approved-vehicles-branches"],
  { revalidate: 3600 } // Cache for 1 hour
);

const getCachedBranchCounts = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("branches")
      .select("city, state, organization_id")
      .eq("status", "approved");
    return data;
  },
  ["approved-branches"],
  { revalidate: 3600 }
);

export type CityInventory = {
  city: string;
  state: string;
  slug: string;
  vehicleCount: number;
  operatorCount: number;
};

export async function getCitiesWithCounts(): Promise<CityInventory[]> {
  const [branchCounts, vehicles] = await Promise.all([
    getCachedBranchCounts(),
    getCachedApprovedVehiclesWithBranches(),
  ]);

  const cityMap = new Map<
    string,
    { city: string; state: string; vehicleCount: number; operators: Set<string> }
  >();

  for (const v of vehicles) {
    const branch = v.branches;
    if (!branch?.city) continue;
    const key = branch.city.toLowerCase();
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: branch.city,
        state: branch.state ?? "",
        vehicleCount: 0,
        operators: new Set(),
      });
    }
    const entry = cityMap.get(key)!;
    entry.vehicleCount += 1;
    if (!entry.state && branch.state) entry.state = branch.state;
  }

  branchCounts?.forEach((b) => {
    const key = b.city.toLowerCase();
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: b.city,
        state: b.state ?? "",
        vehicleCount: 0,
        operators: new Set(),
      });
    }
    cityMap.get(key)!.operators.add(b.organization_id);
  });

  return Array.from(cityMap.values())
    .map((c) => ({
      city: c.city,
      state: c.state,
      slug: cityToSlug(c.city),
      vehicleCount: c.vehicleCount,
      operatorCount: c.operators.size,
    }))
    .sort((a, b) => b.vehicleCount - a.vehicleCount);
}

export async function getCategoryCounts(): Promise<
  { category: VehicleCategory; slug: string; count: number }[]
> {
  const vehicles = await getCachedApprovedVehiclesWithBranches();
  const counts = new Map<VehicleCategory, number>();

  for (const cat of VEHICLE_CATEGORIES) {
    counts.set(cat, 0);
  }

  for (const v of vehicles) {
    const cat = v.category as VehicleCategory;
    if (counts.has(cat)) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }

  return VEHICLE_CATEGORIES.map((category) => ({
    category,
    slug: categoryToSlug(category),
    count: counts.get(category) ?? 0,
  })).filter((c) => c.count > 0);
}

export async function getCityCategoryCombos(): Promise<
  { city: string; citySlug: string; category: VehicleCategory; categorySlug: string; count: number }[]
> {
  const vehicles = await getCachedApprovedVehiclesWithBranches();
  const comboMap = new Map<string, { city: string; category: VehicleCategory; count: number }>();

  for (const v of vehicles) {
    const branch = v.branches;
    if (!branch?.city) continue;
    const category = v.category as VehicleCategory;
    const key = `${branch.city.toLowerCase()}::${category}`;
    if (!comboMap.has(key)) {
      comboMap.set(key, { city: branch.city, category, count: 0 });
    }
    comboMap.get(key)!.count += 1;
  }

  return Array.from(comboMap.values())
    .map((c) => ({
      city: c.city,
      citySlug: cityToSlug(c.city),
      category: c.category,
      categorySlug: categoryToSlug(c.category),
      count: c.count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopCitiesForCategory(
  category: VehicleCategory,
  limit = 8,
): Promise<{ city: string; citySlug: string; count: number }[]> {
  const combos = await getCityCategoryCombos();
  return combos
    .filter((c) => c.category === category)
    .slice(0, limit)
    .map((c) => ({ city: c.city, citySlug: c.citySlug, count: c.count }));
}

export async function getIndexableSitemapUrls() {
  const [cities, categories, combos] = await Promise.all([
    getCitiesWithCounts(),
    getCategoryCounts(),
    getCityCategoryCombos(),
  ]);

  const cityUrls = cities
    .filter((c) => isIndexableCity(c.vehicleCount))
    .map((c) => `/locations/${c.slug}`);

  const categoryUrls = categories
    .filter((c) => isIndexableCategoryNational(c.count))
    .map((c) => `/categories/${c.slug}`);

  const cityCategoryUrls = combos
    .filter((c) => isIndexableCityCategory(c.count))
    .map((c) => `/locations/${c.citySlug}/${c.categorySlug}`);

  return {
    cityUrls,
    categoryUrls,
    cityCategoryUrls,
  };
}
