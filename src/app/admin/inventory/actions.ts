"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validation/vehicle";

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase client at the DB boundary. */

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function logActivity(userId: string, action: string, entityId: string, diff: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  await supabase.from("activity_logs").insert({ user_id: userId, action, entity_type: "vehicle", entity_id: entityId, diff });
}

// unstable_cache tags use the single-arg revalidateTag (per the Next 16 caching
// guide); the 2-arg overload in the types is for Cache Components, unused here.
const revalidate = revalidateTag as (tag: string) => void;
function revalidatePublic() {
  revalidate("vehicles");
  revalidate("public");
}

// Coerce empty-string optionals to null before insert.
function clean<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out as T;
}

async function buildSlug(supabase: any, data: any): Promise<string> {
  const { data: mk } = await supabase.from("makes").select("slug").eq("id", data.makeId).maybeSingle();
  const { data: md } = await supabase.from("models").select("slug").eq("id", data.modelId).maybeSingle();
  return slugify(`${data.year}-${mk?.slug ?? "car"}-${md?.slug ?? ""}-${data.variant ?? ""}-${data.stockId}`);
}

export async function createVehicle(_prev: unknown, formData: FormData) {
  const user = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const featureIds = formData.getAll("featureIds").map(String).filter(Boolean);
  const parsed = vehicleCreateSchema.safeParse({
    ...raw,
    roadworthyIncluded: raw.roadworthyIncluded === "on",
    financeAvailable: raw.financeAvailable === "on",
    tradeInWelcome: raw.tradeInWelcome === "on",
    inspectionAvailable: raw.inspectionAvailable === "on",
    isFeatured: raw.isFeatured === "on",
    featureIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const d = parsed.data;
  const supabase = createAdminClient();
  const slug = await buildSlug(supabase, d);

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

  if (fids.length > 0) {
    await supabase.from("vehicle_features").insert(fids.map((fid) => ({ vehicle_id: created.id, feature_id: fid })));
  }

  // Handle Images
  const imageKeysJson = formData.get("imageKeys") as string;
  if (imageKeysJson) {
    try {
      const images = JSON.parse(imageKeysJson) as { path: string; url: string; isCover: boolean }[];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Ensure media_asset exists
        let mediaId: string;
        const { data: existingMedia } = await supabase.from("media_assets").select("id").eq("storage_key", img.path).maybeSingle();
        if (existingMedia) {
          mediaId = existingMedia.id;
        } else {
          const mime = img.path.endsWith('.png') ? 'image/png' : img.path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          const { data: newMedia } = await supabase.from("media_assets").insert({ storage_key: img.path, mime, uploaded_by: user.id }).select("id").single();
          mediaId = newMedia!.id;
        }

        // Insert into vehicle_images
        await supabase.from("vehicle_images").insert({
          vehicle_id: created.id,
          media_id: mediaId,
          sort_order: i,
          is_cover: img.isCover
        });
      }
    } catch (e) {
      console.error("Failed to process images", e);
    }
  }

  await logActivity(user.id, "vehicle.created", created.id, { stock_id: d.stockId });
  revalidatePublic();
  redirect(`/admin/inventory/${created.id}?created=1`);
}

export async function updateVehicle(_prev: unknown, formData: FormData) {
  const user = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const featureIds = formData.getAll("featureIds").map(String).filter(Boolean);
  const parsed = vehicleUpdateSchema.safeParse({
    ...raw,
    roadworthyIncluded: raw.roadworthyIncluded === "on",
    financeAvailable: raw.financeAvailable === "on",
    tradeInWelcome: raw.tradeInWelcome === "on",
    inspectionAvailable: raw.inspectionAvailable === "on",
    isFeatured: raw.isFeatured === "on",
    featureIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const d = parsed.data;
  const supabase = createAdminClient();
  const { featureIds: fids, id, ...cols } = d;

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

  const { error } = await supabase.from("vehicles").update(row).eq("id", id);
  if (error) return { error: error.message };

  if (fids !== undefined) {
    await supabase.from("vehicle_features").delete().eq("vehicle_id", id);
    if (fids.length > 0) await supabase.from("vehicle_features").insert(fids.map((fid) => ({ vehicle_id: id, feature_id: fid })));
  }

  // Handle Images update
  const imageKeysJson = formData.get("imageKeys") as string;
  if (imageKeysJson) {
    try {
      const images = JSON.parse(imageKeysJson) as { path: string; url: string; isCover: boolean }[];
      
      // Delete existing vehicle_images
      await supabase.from("vehicle_images").delete().eq("vehicle_id", id);

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Ensure media_asset exists
        let mediaId: string;
        const { data: existingMedia } = await supabase.from("media_assets").select("id").eq("storage_key", img.path).maybeSingle();
        if (existingMedia) {
          mediaId = existingMedia.id;
        } else {
          const mime = img.path.endsWith('.png') ? 'image/png' : img.path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          const { data: newMedia } = await supabase.from("media_assets").insert({ storage_key: img.path, mime, uploaded_by: user.id }).select("id").single();
          mediaId = newMedia!.id;
        }

        // Insert into vehicle_images
        await supabase.from("vehicle_images").insert({
          vehicle_id: id,
          media_id: mediaId,
          sort_order: i,
          is_cover: img.isCover
        });
      }
    } catch (e) {
      console.error("Failed to process images", e);
    }
  }

  await logActivity(user.id, "vehicle.updated", id!);
  revalidatePublic();
  return { ok: true };
}

export async function setVehicleStatus(id: string, status: string) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (status === "sold") patch.sold_at = new Date().toISOString();
  if (status !== "draft") patch.published_at = new Date().toISOString();
  const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(user.id, `vehicle.status.${status}`, id);
  revalidatePublic();
  return { ok: true };
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("vehicles").update({ is_featured: isFeatured }).eq("id", id);
  revalidatePublic();
  return { ok: true };
}

export async function deleteVehicle(id: string) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(user.id, "vehicle.deleted", id);
  revalidatePublic();
  redirect("/admin/inventory");
}
