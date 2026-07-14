import { NextResponse, type NextRequest } from "next/server";
import { organizationHasFeature } from "@/lib/plan-features";
import { authenticateApiKey } from "@/lib/security/api-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";
import { apiVehicleCreateSchema } from "@/lib/validation/schemas";

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

export async function GET(request: NextRequest) {
  const result = await requireApiAccess(request);
  if ("error" in result && result.error) return result.error;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, slug, title, make, model, year, category, price_per_day_aud, status, branch_id")
    .eq("organization_id", result.auth!.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ vehicles: data });
}

export async function POST(request: NextRequest) {
  const result = await requireApiAccess(request);
  if ("error" in result && result.error) return result.error;

  const organizationId = result.auth!.organizationId;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = apiVehicleCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = createAdminClient();

  // SECURITY: verify the target branch belongs to the authenticated API key's
  // organization. Without this, a caller could attach vehicles to another org's
  // branch (IDOR / cross-tenant data integrity issue).
  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("id", input.branchId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!branch) {
    return NextResponse.json(
      { error: "Invalid branchId: branch not found for this organization" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      organization_id: organizationId,
      branch_id: input.branchId,
      slug: input.slug ?? `vehicle-${Date.now()}`,
      title: input.title,
      make: input.make,
      model: input.model,
      year: input.year,
      seats: input.seats,
      fuel: input.fuel,
      transmission: input.transmission,
      category: input.category,
      price: input.price,
      status: "pending",
    })
    .select("id, slug, title, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("search_index_jobs").insert({
    vehicle_id: data.id,
    operation: "upsert",
    status: "pending",
  });
  await invalidatePseoForVehicle(supabase, data.id);

  return NextResponse.json({ vehicle: data }, { status: 201 });
}
