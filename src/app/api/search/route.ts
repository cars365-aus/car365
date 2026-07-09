import { NextResponse, type NextRequest } from "next/server";
import { searchVehicles } from "@/lib/search/typesense";
import { clientIp } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { z } from "zod";

const searchParamsSchema = z.object({
  q: z.string().max(100).optional().default(""),
  city: z.string().max(80).optional(),
  state: z.string().max(40).optional(),
  category: z.enum(["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"]).optional(),
  make: z.string().max(80).optional(),
  minPrice: z.coerce.number().int().min(0).max(2000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(2000).optional(),
  seats: z.coerce.number().int().min(2).max(12).optional(),
  transmission: z.enum(["Automatic", "Manual"]).optional(),
  fuel: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["price_per_day_aud:asc", "price_per_day_aud:desc", "year:desc", "avg_rating:desc"])
    .optional()
    .default("price_per_day_aud:asc"),
  pickup: z.string().max(20).optional(),
  return: z.string().max(20).optional(),
});

export async function GET(request: NextRequest) {
  // Rate limit search requests (30 per minute per IP)
  const ip = clientIp(request.headers);
  const limit = await rateLimitSlidingWindow(`search:${ip}`, 30, 60_000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many search requests",
        retryAfter: limit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter || 60) } },
    );
  }

  const { searchParams } = new URL(request.url);

  const parsed = searchParamsSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    make: searchParams.get("make") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    seats: searchParams.get("seats") ?? undefined,
    transmission: searchParams.get("transmission") ?? undefined,
    fuel: searchParams.get("fuel") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    perPage: searchParams.get("perPage") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    pickup: searchParams.get("pickup") ?? undefined,
    return: searchParams.get("return") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const params = parsed.data;

  try {
    const results = await searchVehicles(
      params.q,
      {
        city: params.city,
        state: params.state,
        category: params.category,
        make: params.make,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        seats: params.seats,
        transmission: params.transmission,
        fuel: params.fuel,
      },
      {
        page: params.page,
        perPage: params.perPage,
        sortBy: params.sortBy,
      },
    );

    return NextResponse.json({
      ...results,
      dateRange:
        params.pickup || params.return
          ? { pickup: params.pickup, return: params.return }
          : undefined,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
