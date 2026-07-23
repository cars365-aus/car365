"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleCreateSchema, vehicleUpdateSchema, vehicleCsvRowSchema } from "@/lib/validation/vehicle";

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
  for (const [k, v] of Object.entries(obj)) out[k] = (v === "" || v === undefined) ? null : v;
  return out as T;
}

async function buildSlug(supabase: any, data: any): Promise<string> {
  const mk = data.makeId ? (await supabase.from("makes").select("slug").eq("id", data.makeId).maybeSingle()).data : null;
  const md = data.modelId ? (await supabase.from("models").select("slug").eq("id", data.modelId).maybeSingle()).data : null;
  return slugify(`${data.year ?? "year"}-${mk?.slug ?? "make"}-${md?.slug ?? "model"}-${data.variant ?? ""}-${data.stockId || Math.random().toString(36).slice(2, 8)}`);
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
    make_id: cols.makeId, model_id: cols.modelId,
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
  await logActivity(user.id, "vehicle.deleted", id);
  revalidatePublic();
  revalidatePath("/admin/inventory");
  if (shouldRedirect) {
    redirect("/admin/inventory");
  } else {
    return { ok: true };
  }
}

export async function bulkUploadVehicles(rows: any[]) {
  const user = await requireAdmin();
  const supabase = createAdminClient();
  
  let successCount = 0;
  const errors: { row: number; error: string }[] = [];

  // Fetch all makes and models to resolve names to UUIDs
  const { data: makesData } = await supabase.from("makes").select("id, name, slug");
  const { data: modelsData } = await supabase.from("models").select("id, make_id, name, slug");
  
  const makes = (makesData ?? []) as any[];
  const models = (modelsData ?? []) as any[];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsed = vehicleCsvRowSchema.safeParse(row);
    
    if (!parsed.success) {
      errors.push({ row: i + 2, error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
      continue;
    }
    
    const d = parsed.data;
    
    // Resolve Make
    let makeId: string | null = null;
    let makeSlug = "make";
    if (d.make) {
      makeSlug = slugify(d.make);
      const existingMake = makes.find(m => m.slug === makeSlug || m.name.toLowerCase() === d.make!.toLowerCase());
      
      if (existingMake) {
        makeId = existingMake.id;
      } else {
        const { data: newMake, error: makeError } = await supabase.from("makes")
          .insert({ name: d.make, slug: makeSlug, is_popular: false })
          .select("id, name, slug")
          .single();
          
        if (makeError) {
          errors.push({ row: i + 2, error: `Failed to create make '${d.make}': ${makeError.message}` });
          continue;
        }
        makeId = newMake.id;
        makes.push(newMake);
      }
    }
    
    // Resolve Model
    let modelId: string | null = null;
    let modelSlug = "model";
    if (d.model && makeId) {
      modelSlug = slugify(d.model);
      const existingModel = models.find(m => m.make_id === makeId && (m.slug === modelSlug || m.name.toLowerCase() === d.model!.toLowerCase()));
      
      if (existingModel) {
        modelId = existingModel.id;
      } else {
        const { data: newModel, error: modelError } = await supabase.from("models")
          .insert({ make_id: makeId, name: d.model, slug: modelSlug })
          .select("id, make_id, name, slug")
          .single();
          
        if (modelError) {
          errors.push({ row: i + 2, error: `Failed to create model '${d.model}': ${modelError.message}` });
          continue;
        }
        modelId = newModel.id;
        models.push(newModel);
      }
    }

    // Build vehicle slug
    const vehicleSlug = slugify(`${d.year ?? "year"}-${makeSlug}-${modelSlug}-${d.variant ?? ""}-${d.stock_id || Math.random().toString(36).slice(2, 8)}`);

    // Insert vehicle
    const vehicleRow = clean({
      stock_id: d.stock_id,
      slug: vehicleSlug,
      make_id: makeId,
      model_id: modelId,
      variant: d.variant,
      year: d.year,
      mileage_km: d.mileage_km,
      fuel_type: d.fuel_type,
      transmission: d.transmission,
      body_type: d.body_type,
      drive_type: d.drive_type,
      price: d.price,
      exterior_color: d.exterior_color,
      description: d.description,
      engine: d.engine,
      power_kw: d.power_kw,
      seats: d.seats,
      doors: d.doors,
      interior: d.interior,
      vin: d.vin,
      registration: d.registration,
      rego_expiry: d.rego_expiry,
      weekly_estimate: d.weekly_estimate,
      safety_rating: d.safety_rating,
      warranty_text: d.warranty_text,
      dealer_notes: d.dealer_notes,
      status: "draft", // Start as draft when bulk imported
      is_featured: false,
      roadworthy_included: d.roadworthy_included ?? false,
      finance_available: d.finance_available ?? true,
      trade_in_welcome: d.trade_in_welcome ?? true,
      inspection_available: d.inspection_available ?? true,
    });

    const { error: insertError } = await supabase.from("vehicles").insert(vehicleRow);
    
    if (insertError) {
      // Avoid duplicate stock id errors showing up cryptically
      if (insertError.code === "23505") {
        errors.push({ row: i + 2, error: `Duplicate stock ID '${d.stock_id}'` });
      } else {
        errors.push({ row: i + 2, error: `Failed to insert vehicle: ${insertError.message}` });
      }
      continue;
    }

    successCount++;
  }

  if (successCount > 0) {
    await logActivity(user.id, "vehicle.bulk_uploaded", "bulk", { successCount, errorCount: errors.length });
    revalidatePublic();
    revalidatePath("/admin/inventory");
  }

  return { error: null, successCount, errors };
}
