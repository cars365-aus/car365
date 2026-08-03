"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validation/vehicle";

/* eslint-disable @typescript-eslint/no-explicit-any */

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Fire-and-forget activity log — never awaited on the critical path. */
function logActivityBg(userId: string, action: string, entityId: string, diff: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  // intentionally not awaited
  supabase.from("activity_logs")
    .insert({ user_id: userId, action, entity_type: "vehicle", entity_id: entityId, diff })
    .then(() => { /* no-op */ });
}

const revalidate = revalidateTag as (tag: string) => void;
function revalidatePublic() {
  revalidate("vehicles");
  revalidate("public");
}

// Coerce empty-string optionals to null before DB insert.
function clean<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

/**
 * Pre-sanitize raw FormData entries before Zod validation.
 * driveType: empty string → deleted (avoids enum crash)
 * powerKw / seats / doors: empty string or "0" → deleted (avoids min(1) crash)
 */
function sanitizeRaw(raw: Record<string, any>) {
  const out = { ...raw };
  if (!out.driveType || out.driveType === "") delete out.driveType;
  for (const field of ["powerKw", "seats", "doors", "weeklyEstimate", "featuredOrder"]) {
    const v = out[field];
    if (v === "" || v === "0" || v === 0 || v === null || v === undefined) delete out[field];
  }
  if (!out.locationId || out.locationId === "") delete out.locationId;
  return out;
}

/** Parallel slug build — fetches make + model slugs in one Promise.all. */
async function buildSlug(supabase: any, data: any): Promise<string> {
  const [{ data: mk }, { data: md }] = await Promise.all([
    supabase.from("makes").select("slug").eq("id", data.makeId).maybeSingle(),
    supabase.from("models").select("slug").eq("id", data.modelId).maybeSingle(),
  ]);
  return slugify(`${data.year}-${mk?.slug ?? "car"}-${md?.slug ?? ""}-${data.variant ?? ""}-${data.stockId}`);
}

function mimeFor(path: string) {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * Batch-resolve media_asset IDs for a list of image paths.
 *
 * Strategy:
 * 1. Single SELECT for all paths at once (IN query) — O(1) round trips instead of O(N).
 * 2. For any paths not yet in media_assets, bulk-insert them in one INSERT.
 * 3. Return a map of path → media_asset id.
 */
async function resolveMediaIds(
  supabase: any,
  images: { path: string; url: string; isCover: boolean }[],
  uploadedBy: string,
): Promise<Map<string, string>> {
  if (images.length === 0) return new Map();

  const paths = images.map((i) => i.path);

  // Single round trip: fetch all existing media_assets for these paths
  const { data: existing } = await supabase
    .from("media_assets")
    .select("id, storage_key")
    .in("storage_key", paths);

  const idMap = new Map<string, string>(
    (existing ?? []).map((r: any) => [r.storage_key, r.id]),
  );

  // Find which paths are new (not in DB yet)
  const newPaths = paths.filter((p) => !idMap.has(p));

  if (newPaths.length > 0) {
    // Single bulk INSERT for all new media_assets
    const { data: inserted } = await supabase
      .from("media_assets")
      .insert(newPaths.map((p) => ({ storage_key: p, mime: mimeFor(p), uploaded_by: uploadedBy })))
      .select("id, storage_key");

    for (const r of inserted ?? []) {
      idMap.set(r.storage_key, r.id);
    }
  }

  return idMap;
}

/**
 * Bulk-write vehicle_images rows in a single INSERT.
 * For updates: caller deletes existing rows first, then calls this.
 */
async function writeVehicleImages(
  supabase: any,
  vehicleId: string,
  images: { path: string; url: string; isCover: boolean }[],
  mediaIdMap: Map<string, string>,
) {
  if (images.length === 0) return;

  const rows = images
    .map((img, i) => {
      const mediaId = mediaIdMap.get(img.path);
      if (!mediaId) return null;
      return { vehicle_id: vehicleId, media_id: mediaId, sort_order: i, is_cover: img.isCover };
    })
    .filter(Boolean);

  if (rows.length > 0) {
    await supabase.from("vehicle_images").insert(rows);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function createVehicle(_prev: unknown, formData: FormData) {
  const user = await requireAdmin();
  const rawRaw = Object.fromEntries(formData.entries());
  const featureIds = formData.getAll("featureIds").map(String).filter(Boolean);
  const raw = sanitizeRaw(rawRaw);

  const parsed = vehicleCreateSchema.safeParse({
    ...raw,
    roadworthyIncluded:    rawRaw.roadworthyIncluded    === "on",
    financeAvailable:      rawRaw.financeAvailable       === "on",
    tradeInWelcome:        rawRaw.tradeInWelcome         === "on",
    inspectionAvailable:   rawRaw.inspectionAvailable    === "on",
    isFeatured:            rawRaw.isFeatured             === "on",
    featureIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }

  const d = parsed.data;
  const supabase = createAdminClient();

  // Parse images JSON early so we can start resolving media in parallel with slug build
  let images: { path: string; url: string; isCover: boolean }[] = [];
  const imageKeysJson = formData.get("imageKeys") as string | null;
  if (imageKeysJson) {
    try { images = JSON.parse(imageKeysJson); } catch { /* ignore */ }
  }

  // ── Parallel: build slug + resolve media asset IDs ──────────────────────
  const [slug, mediaIdMap] = await Promise.all([
    buildSlug(supabase, d),
    resolveMediaIds(supabase, images, user.id),
  ]);

  const { featureIds: fids, ...cols } = d;
  const row = clean({
    stock_id: d.stockId, slug, make_id: d.makeId, model_id: d.modelId, variant: cols.variant,
    year: d.year, mileage_km: d.mileageKm, fuel_type: d.fuelType, transmission: d.transmission,
    body_type: d.bodyType, drive_type: cols.driveType ?? null, engine: cols.engine, power_kw: cols.powerKw ?? null,
    seats: cols.seats ?? null, doors: cols.doors ?? null, exterior_color: cols.exteriorColor, interior: cols.interior,
    vin: cols.vin, registration: cols.registration, rego_expiry: cols.regoExpiry, price: d.price,
    weekly_estimate: cols.weeklyEstimate ?? null, description: cols.description, safety_rating: cols.safetyRating,
    warranty_text: cols.warrantyText, roadworthy_included: d.roadworthyIncluded, finance_available: d.financeAvailable,
    trade_in_welcome: d.tradeInWelcome, inspection_available: d.inspectionAvailable, status: d.status,
    is_featured: d.isFeatured, featured_order: cols.featuredOrder ?? null, location_id: cols.locationId ?? null,
    dealer_notes: cols.dealerNotes,
    published_at: d.status !== "draft" ? new Date().toISOString() : null,
  });

  const { data: created, error } = await supabase.from("vehicles").insert(row).select("id").single();
  if (error) return { error: error.message };

  // ── Parallel: features + images ─────────────────────────────────────────
  await Promise.all([
    fids.length > 0
      ? supabase.from("vehicle_features").insert(fids.map((fid) => ({ vehicle_id: created.id, feature_id: fid })))
      : Promise.resolve(),
    writeVehicleImages(supabase, created.id, images, mediaIdMap),
  ]);

  // Fire-and-forget audit log — doesn't block the redirect
  logActivityBg(user.id, "vehicle.created", created.id, { stock_id: d.stockId });
  revalidatePublic();
  redirect(`/admin/inventory/${created.id}?created=1`);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function updateVehicle(_prev: unknown, formData: FormData) {
  const user = await requireAdmin();
  const rawRaw = Object.fromEntries(formData.entries());
  const featureIds = formData.getAll("featureIds").map(String).filter(Boolean);
  const raw = sanitizeRaw(rawRaw);

  const parsed = vehicleUpdateSchema.safeParse({
    ...raw,
    roadworthyIncluded:    rawRaw.roadworthyIncluded    === "on",
    financeAvailable:      rawRaw.financeAvailable       === "on",
    tradeInWelcome:        rawRaw.tradeInWelcome         === "on",
    inspectionAvailable:   rawRaw.inspectionAvailable    === "on",
    isFeatured:            rawRaw.isFeatured             === "on",
    featureIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }

  const d = parsed.data;
  const supabase = createAdminClient();
  const { featureIds: fids, id, ...cols } = d;

  // Parse images JSON early
  let images: { path: string; url: string; isCover: boolean }[] = [];
  const imageKeysJson = formData.get("imageKeys") as string | null;
  if (imageKeysJson) {
    try { images = JSON.parse(imageKeysJson); } catch { /* ignore */ }
  }

  const row = clean({
    variant: cols.variant, year: cols.year, mileage_km: cols.mileageKm, fuel_type: cols.fuelType,
    transmission: cols.transmission, body_type: cols.bodyType, drive_type: cols.driveType,
    engine: cols.engine, power_kw: cols.powerKw, seats: cols.seats, doors: cols.doors,
    exterior_color: cols.exteriorColor, interior: cols.interior, vin: cols.vin, registration: cols.registration,
    rego_expiry: cols.regoExpiry, price: cols.price, weekly_estimate: cols.weeklyEstimate, description: cols.description,
    safety_rating: cols.safetyRating, warranty_text: cols.warrantyText, roadworthy_included: cols.roadworthyIncluded,
    finance_available: cols.financeAvailable, trade_in_welcome: cols.tradeInWelcome, inspection_available: cols.inspectionAvailable,
    status: cols.status, is_featured: cols.isFeatured, featured_order: cols.featuredOrder,
    location_id: cols.locationId, dealer_notes: cols.dealerNotes,
  });

  // ── Parallel: vehicle row update + media ID resolution ──────────────────
  const [updateResult, mediaIdMap] = await Promise.all([
    supabase.from("vehicles").update(row).eq("id", id),
    resolveMediaIds(supabase, images, user.id),
  ]);
  if (updateResult.error) return { error: updateResult.error.message };

  // ── Parallel: features replace + images replace ──────────────────────────
  await Promise.all([
    // Features: delete-then-reinsert (must be sequential within itself)
    (async () => {
      if (fids !== undefined) {
        await supabase.from("vehicle_features").delete().eq("vehicle_id", id);
        if (fids.length > 0) {
          await supabase.from("vehicle_features").insert(fids.map((fid) => ({ vehicle_id: id, feature_id: fid })));
        }
      }
    })(),
    // Images: delete-then-reinsert (must be sequential within itself)
    (async () => {
      if (imageKeysJson) {
        await supabase.from("vehicle_images").delete().eq("vehicle_id", id);
        await writeVehicleImages(supabase, id!, images, mediaIdMap);
      }
    })(),
  ]);

  // Fire-and-forget audit log
  logActivityBg(user.id, "vehicle.updated", id!);
  revalidatePublic();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function setVehicleStatus(id: string, status: string) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (status === "sold") patch.sold_at = new Date().toISOString();
  if (status !== "draft") patch.published_at = new Date().toISOString();
  const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  logActivityBg(user.id, `vehicle.status.${status}`, id);
  revalidatePublic();
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("vehicles").update({ is_featured: isFeatured }).eq("id", id);
  revalidatePublic();
  revalidatePath("/admin/inventory");
  return { ok: true };
}

export async function deleteVehicle(id: string, shouldRedirect: boolean = true) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };
  logActivityBg(user.id, "vehicle.deleted", id);
  revalidatePublic();
  revalidatePath("/admin/inventory");
  if (shouldRedirect) {
    redirect("/admin/inventory");
  } else {
    return { ok: true };
  }
}
