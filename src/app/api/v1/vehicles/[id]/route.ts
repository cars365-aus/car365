import { NextResponse, type NextRequest } from "next/server";
import { organizationHasFeature } from "@/lib/plan-features";
import { authenticateApiKey } from "@/lib/security/api-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";

async function requireApiAccess(request: NextRequest) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) {
    return { error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }
  const allowed = await organizationHasFeature(auth.organizationId, "apiAccess");
  if (!allowed) {
    return { error: NextResponse.json({ error: "API access requires Pro plan" }, { status: 403 }) };
  }
  return { auth };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireApiAccess(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.make !== undefined) updates.make = body.make;
  if (body.model !== undefined) updates.model = body.model;
  if (body.year !== undefined) updates.year = body.year;
  if (body.seats !== undefined) updates.seats = body.seats;
  if (body.fuel !== undefined) updates.fuel = body.fuel;
  if (body.transmission !== undefined) updates.transmission = body.transmission;
  if (body.category !== undefined) updates.category = body.category;
  if (body.pricePerDayAud !== undefined) updates.price_per_day_aud = body.pricePerDayAud;
  if (body.branchId !== undefined) updates.branch_id = body.branchId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", result.auth!.organizationId)
    .select("id, slug, title, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  await supabase.from("search_index_jobs").insert({
    vehicle_id: id,
    operation: "upsert",
    status: "pending",
  });
  await invalidatePseoForVehicle(supabase, id);

  return NextResponse.json({ vehicle: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireApiAccess(request);
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("vehicles")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", result.auth!.organizationId)
    .select("id, slug, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  await supabase.from("search_index_jobs").insert({
    vehicle_id: id,
    operation: "delete",
    status: "pending",
  });
  await invalidatePseoForVehicle(supabase, id);

  return NextResponse.json({ vehicle: data });
}
