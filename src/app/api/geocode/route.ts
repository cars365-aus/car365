import { NextResponse, type NextRequest } from "next/server";

import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limited = rateLimit(`geocode:${ip}`, 60, 60_000);

  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many geocoding requests", features: [] },
      { status: 429 },
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "5");
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 10)
    : 5;

  if (q.length < 2) {
    return NextResponse.json({ features: [] });
  }

  if (q.length > 80) {
    return NextResponse.json(
      { error: "Query is too long", features: [] },
      { status: 400 },
    );
  }

  try {
    // We request a larger limit and use a strict bounding box for Australia (minLon,minLat,maxLon,maxLat)
    // to ensure we capture localized suburbs, towns, and airports rather than getting drowned out
    // by global mega-cities before our filter applies.
    const upstream = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=40&bbox=112.9,-43.6,153.6,-10.6`,
      {
        headers: {
          // Be a good citizen: identify our proxy to Photon.
          "User-Agent": "Hire Car/1.0 (geocode-proxy)",
        },
        // Don't cache stale autocomplete results.
        cache: "no-store",
      },
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream geocoding service error", features: [] },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    
    // Hard restrict to Australia as requested by the user
    if (data.features && Array.isArray(data.features)) {
      data.features = data.features.filter((f: { properties?: { countrycode?: string; country?: string } }) => 
        f.properties?.countrycode === "AU" || 
        f.properties?.country === "Australia"
      ).slice(0, limit);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[geocode] Upstream fetch failed:", error);
    return NextResponse.json(
      { error: "Geocoding unavailable", features: [] },
      { status: 502 },
    );
  }
}
