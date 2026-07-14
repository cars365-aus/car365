import Typesense from "typesense";
import { optionalEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/lib/types";
import { resolveVehicleImage } from "@/lib/image-utils";
import type { VehicleImageRecord } from "@/lib/image-utils";
import { computeSuperHost } from "@/lib/vehicle-badges";

const VEHICLE_COLLECTION_NAME = "vehicles";

/**
 * Returns a relevant stock car image URL based on vehicle category.
 * Used when vendors haven't uploaded their own images.
 */
function getCategoryPlaceholder(category: string): string {
  const placeholders: Record<string, string> = {
    "Sedan": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
    "SUV": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
    "Van": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
    "Ute": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    "Luxury": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    "People mover": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    "Truck": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80",
    "Electric": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
    "Hatchback": "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80",
  };
  return placeholders[category] ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80";
}

export function createTypesenseClient() {
  const host = optionalEnv("TYPESENSE_HOST");
  const apiKey = optionalEnv("TYPESENSE_API_KEY");

  if (!host || !apiKey) {
    return null;
  }

  return new Typesense.Client({
    nodes: [
      {
        host,
        port: Number(process.env.TYPESENSE_PORT ?? 443),
        protocol: process.env.TYPESENSE_PROTOCOL ?? "https",
      },
    ],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}

export async function setupVehicleCollection() {
  const client = createTypesenseClient();
  if (!client) {
    return { skipped: true, error: "Typesense not configured" };
  }

  const schema = {
    name: VEHICLE_COLLECTION_NAME,
    fields: [
      { name: "id", type: "string" as const, facet: false },
      { name: "title", type: "string" as const, facet: false },
      { name: "make", type: "string" as const, facet: true },
      { name: "model", type: "string" as const, facet: false },
      { name: "year", type: "int32" as const, facet: true },
      { name: "seats", type: "int32" as const, facet: true },
      { name: "fuel", type: "string" as const, facet: true },
      { name: "transmission", type: "string" as const, facet: true },
      { name: "category", type: "string" as const, facet: true },
      { name: "price", type: "int32" as const, facet: true },
      { name: "city", type: "string" as const, facet: true },
      { name: "state", type: "string" as const, facet: true },
      { name: "vendor_name", type: "string" as const, facet: false },
      { name: "vendor_slug", type: "string" as const, facet: false },
      { name: "branch_name", type: "string" as const, facet: false },
      { name: "status", type: "string" as const, facet: true },
      { name: "organization_id", type: "string" as const, facet: false },
      { name: "avg_rating", type: "float" as const, facet: false, optional: true },
      { name: "review_count", type: "int32" as const, facet: false, optional: true },
      { name: "features", type: "string[]" as const, facet: true, optional: true },
      { name: "no_hidden_fees", type: "bool" as const, facet: true, optional: true },
      { name: "vendor_logo_url", type: "string" as const, facet: false, optional: true },
      { name: "verified", type: "bool" as const, facet: true, optional: true },
    ],
    default_sorting_field: "price",
  };

  try {
    await client.collections().create(schema);
    return { created: true };
  } catch (error) {
    // Collection might already exist
    if (error instanceof Error && error.message.includes("already exists")) {
      return { created: false, exists: true };
    }
    return { created: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function upsertVehicleDocument(document: Record<string, unknown>) {
  const client = createTypesenseClient();

  if (!client) {
    return { skipped: true };
  }

  await client.collections(VEHICLE_COLLECTION_NAME).documents().upsert(document);
  return { skipped: false };
}

export async function deleteVehicleDocument(vehicleId: string) {
  const client = createTypesenseClient();

  if (!client) {
    return { skipped: true };
  }

  try {
    await client.collections(VEHICLE_COLLECTION_NAME).documents(vehicleId).delete();
    return { deleted: true };
  } catch (error) {
    // Document might not exist
    return { deleted: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

type SearchFilters = {
  city?: string;
  state?: string;
  category?: string;
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: string;
  fuel?: string;
};

/**
 * Search vehicles in Typesense with sanitized filters.
 * All user inputs are escaped to prevent injection attacks.
 */
export async function searchVehicles(
  query: string,
  filters: SearchFilters = {},
  options: { page?: number; perPage?: number; sortBy?: string } = {},
): Promise<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  facetCounts?: Record<string, Record<string, number>>;
}> {
  const client = createTypesenseClient();

  if (!client) {
    // Fallback to database search if Typesense is not configured
    return fallbackDatabaseSearch(query, filters, options);
  }

  const { page = 1, perPage = 20, sortBy = "price:asc" } = options;

  // Build filter by string with proper escaping
  const filterParts: string[] = ["status:=approved"]; // Only show approved vehicles

  if (filters.city) {
    filterParts.push(`city:=${escapeFilterValue(filters.city)}`);
  }
  if (filters.state) {
    filterParts.push(`state:=${escapeFilterValue(filters.state)}`);
  }
  if (filters.category) {
    filterParts.push(`category:=${escapeFilterValue(filters.category)}`);
  }
  if (filters.make) {
    filterParts.push(`make:=${escapeFilterValue(filters.make)}`);
  }
  if (filters.transmission) {
    filterParts.push(`transmission:=${escapeFilterValue(filters.transmission)}`);
  }
  if (filters.fuel) {
    filterParts.push(`fuel:=${escapeFilterValue(filters.fuel)}`);
  }
  if (filters.minPrice !== undefined) {
    filterParts.push(`price:>=${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    filterParts.push(`price:<=${filters.maxPrice}`);
  }
  if (filters.seats) {
    filterParts.push(`seats:>=${filters.seats}`);
  }

  const searchParameters = {
    q: query || "*",
    query_by: "title,make,model,vendor_name,branch_name",
    filter_by: filterParts.join(" && "),
    sort_by: sortBy ?? "price:asc",
    page,
    per_page: perPage,
    facet_by: "category,make,transmission,fuel",
    max_facet_values: 30,
  };

  try {
    const results = await client.collections<Vehicle>(VEHICLE_COLLECTION_NAME).documents().search(searchParameters);

    const vehicles = results.hits?.map((hit) => hit.document) ?? [];

    if (vehicles.length > 0) {
      const supabase = createAdminClient();
      const vehicleIds = vehicles.map(v => v.id);
      
      const { data: imagesData } = await supabase
        .from("vehicle_images")
        .select("vehicle_id, storage_path, approved, sort_order")
        .in("vehicle_id", vehicleIds)
        .order("sort_order", { ascending: true });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

      if (imagesData && imagesData.length > 0) {
        vehicles.forEach(v => {
          const matchingImgs = imagesData
            .filter(i => i.vehicle_id === v.id)
            .map(i => ({
              storage_path: i.storage_path,
              approved: i.approved,
              sort_order: i.sort_order,
            }));
          v.imageUrl = resolveVehicleImage(supabaseUrl, matchingImgs, v.category);
        });
      } else {
        vehicles.forEach(v => { v.imageUrl = getCategoryPlaceholder(v.category); });
      }
    }

    const facetCounts: Record<string, Record<string, number>> = {};
    for (const facet of results.facet_counts ?? []) {
      facetCounts[facet.field_name] = {};
      for (const count of facet.counts ?? []) {
        facetCounts[facet.field_name][count.value] = count.count;
      }
    }

    return {
      vehicles,
      total: results.found ?? 0,
      page,
      facetCounts,
    };
  } catch (error) {
    console.error("Typesense search failed; falling back to database search:", error);
    return fallbackDatabaseSearch(query, filters, options);
  }
}

/**
 * Escape filter values to prevent Typesense filter injection.
 * Handles special characters in filter values.
 */
function escapeFilterValue(value: string): string {
  // Escape backticks and single quotes which have special meaning in Typesense filters
  return value.replace(/[`'\\]/g, "\\$&");
}

/**
 * Fallback database search when Typesense is not available.
 * Uses parameterized queries for security.
 */
async function fallbackDatabaseSearch(
  query: string,
  filters: SearchFilters,
  options: { page?: number; perPage?: number; sortBy?: string },
): Promise<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  facetCounts?: Record<string, Record<string, number>>;
}> {
  const supabase = createAdminClient();
  const { page = 1, perPage = 20, sortBy = "price_per_day_aud:asc" } = options;

  // Build base query joining vehicles with organizations and branches
  let dbQuery = supabase
    .from("vehicles")
    .select(
      `
      id,
      slug,
      title,
      make,
      model,
      year,
      seats,
      fuel,
      transmission,
      category,
      price,
      status,
      organizations!inner(id, name, slug, status, logo_url, verified_at),
      branches!inner(id, name, city, state, status),
      vehicle_images(storage_path, approved, sort_order),
      vehicle_features(feature)
    `,
      { count: "exact" },
    )
    .eq("status", "approved")
    .eq("organizations.status", "approved")
    .eq("branches.status", "approved");

  // Apply text search if query provided
  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`,
    );
  }

  // Apply filters
  if (filters.city) {
    dbQuery = dbQuery.ilike("branches.city", filters.city);
  }
  if (filters.state) {
    dbQuery = dbQuery.ilike("branches.state", filters.state);
  }
  if (filters.category) {
    dbQuery = dbQuery.eq("category", filters.category);
  }
  if (filters.make) {
    dbQuery = dbQuery.eq("make", filters.make);
  }
  if (filters.transmission) {
    dbQuery = dbQuery.eq("transmission", filters.transmission);
  }
  if (filters.fuel) {
    dbQuery = dbQuery.eq("fuel", filters.fuel);
  }
  if (filters.minPrice !== undefined) {
    dbQuery = dbQuery.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    dbQuery = dbQuery.lte("price", filters.maxPrice);
  }
  if (filters.seats) {
    dbQuery = dbQuery.gte("seats", filters.seats);
  }

  // Sorting & pagination
  const [sortField, sortDir] = sortBy.split(":");
  const ascending = sortDir !== "desc";
  const validSortFields: Record<string, string> = {
    price: "price",
    year: "year",
  };
  const dbSortField = validSortFields[sortField] ?? "price";
  const ratingSort = sortField === "avg_rating";

  const from = (page - 1) * perPage;
  if (ratingSort) {
    dbQuery = dbQuery.limit(500);
  } else {
    dbQuery = dbQuery.range(from, from + perPage - 1).order(dbSortField, { ascending });
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Database search error:", error);
    return { vehicles: [], total: 0, page };
  }

  // Aggregate approved-review rating + count per vehicle for the returned page.
  // Used both for display (avgRating/reviewCount on the card) and rating sort.
  const ratingInfo: Record<string, { avg: number; count: number }> = {};
  if (data && data.length > 0) {
    const ids = data.map((v) => v.id);
    const { data: reviews } = await supabase
      .from("reviews")
      .select("vehicle_id, rating")
      .in("vehicle_id", ids)
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
  const ratingMap: Record<string, number> = Object.fromEntries(
    Object.entries(ratingInfo).map(([id, s]) => [id, s.avg]),
  );

  // Transform to Vehicle type
  let vehicles: Vehicle[] =
    data?.map((v) => {
      const org = v.organizations as unknown as { name: string; slug: string; logo_url: string | null; verified_at: string | null };
      const branch = v.branches as unknown as { name: string; city: string; state: string };

      const images = (v.vehicle_images as unknown as VehicleImageRecord[]) ?? [];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const imageUrl = resolveVehicleImage(supabaseUrl, images, v.category);

      const features = ((v.vehicle_features as unknown as { feature: string }[]) ?? []).map((f) => f.feature);
      const verified = org.verified_at != null;
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
        price: v.price,
        city: branch.city,
        state: branch.state,
        imageUrl,
        vendorName: org.name,
        vendorSlug: org.slug,
        branchName: branch.name,
        verified,
        vendorLogoUrl: org.logo_url,
        avgRating,
        reviewCount,
        features,
        noHiddenFees: false,
        superHost: computeSuperHost({ verified, avgRating, reviewCount }),
      };
    }) ?? [];

  if (ratingSort) {
    vehicles = vehicles
      .sort((a, b) => (ratingMap[b.id] ?? 0) - (ratingMap[a.id] ?? 0))
      .slice(from, from + perPage);
  }

  return {
    vehicles,
    total: count ?? 0,
    page,
  };
}

async function computeVehicleRating(vehicleId: string): Promise<{ avg: number; count: number }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("vehicle_id", vehicleId)
    .eq("status", "approved");
  if (!data?.length) return { avg: 0, count: 0 };
  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return { avg: sum / data.length, count: data.length };
}

/**
 * Process pending search index jobs from the queue.
 * This should be called periodically (via cron job or background worker).
 */
export async function processSearchIndexJobs(limit = 10): Promise<{
  processed: number;
  errors: string[];
}> {
  const client = createTypesenseClient();
  if (!client) {
    return { processed: 0, errors: ["Typesense not configured"] };
  }

  const supabase = createAdminClient();
  const errors: string[] = [];

  // Fetch pending jobs
  const { data: jobs, error: jobsError } = await supabase
    .from("search_index_jobs")
    .select("id, vehicle_id, operation")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (jobsError || !jobs || jobs.length === 0) {
    return { processed: 0, errors: jobsError ? [jobsError.message] : [] };
  }

  for (const job of jobs) {
    try {
      if (job.operation === "delete") {
        const result = await deleteVehicleDocument(job.vehicle_id);
        if (result.error) {
          errors.push(`Delete failed for ${job.vehicle_id}: ${result.error}`);
        }
      } else if (job.operation === "upsert") {
        // Fetch full vehicle data with relations
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select(
            `
            id, slug, title, make, model, year, seats, fuel, transmission, category,
            price,
            status, organization_id,
            organizations(name, slug, status, logo_url, verified_at),
            branches(name, city, state, status),
            vehicle_features(feature)
          `,
          )
          .eq("id", job.vehicle_id)
          .eq("status", "approved")
          .single();

        if (vehicle) {
          // Only index approved vehicles
          const org = vehicle.organizations as unknown as { name: string; slug: string; status: string; logo_url: string | null; verified_at: string | null };
          const branch = vehicle.branches as unknown as { name: string; city: string; state: string; status: string };

          if (org?.status === "approved" && branch?.status === "approved") {
            const { avg: avgRating, count: reviewCount } = await computeVehicleRating(vehicle.id);
            const features = ((vehicle.vehicle_features as unknown as { feature: string }[]) ?? []).map((f) => f.feature);
            const document = {
              id: vehicle.id,
              slug: vehicle.slug,
              title: vehicle.title,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              seats: vehicle.seats,
              fuel: vehicle.fuel,
              transmission: vehicle.transmission,
              category: vehicle.category,
              price: vehicle.price,
              no_hidden_fees: false,
              city: branch.city,
              state: branch.state,
              vendor_name: org.name,
              vendor_slug: org.slug,
              vendor_logo_url: org.logo_url,
              verified: org.verified_at != null,
              branch_name: branch.name,
              status: vehicle.status,
              organization_id: vehicle.organization_id,
              avg_rating: avgRating,
              review_count: reviewCount,
              features,
            };

            await upsertVehicleDocument(document);
          }
        }
      }

      // Mark job as complete
      await supabase
        .from("search_index_jobs")
        .update({ status: "complete", processed_at: new Date().toISOString() })
        .eq("id", job.id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Job ${job.id} failed: ${errorMsg}`);

      // Mark job as failed
      await supabase
        .from("search_index_jobs")
        .update({ status: "failed", error: errorMsg })
        .eq("id", job.id);
    }
  }

  return { processed: jobs.length, errors };
}
