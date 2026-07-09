"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import {
  ensureUserCanManageOrganization,
  getVehicleLimitInfo,
} from "@/lib/data/vendor";
import { vehicleSchema } from "@/lib/validation/schemas";
import { uniqueSlug } from "@/lib/slug";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";
import { evaluateVehicleListing } from "@/lib/ai/vehicle-moderation";

export type VehicleActionResult =
  | { success: true; vehicleId: string }
  | { success: false; error: string };

export async function createVehicle(formData: FormData): Promise<VehicleActionResult> {
  try {
    const user = await requireUser();

    const organizationId = formData.get("organizationId") as string;
    const branchId = formData.get("branchId") as string;

    if (!organizationId || !branchId) {
      return { success: false, error: "Organization and branch are required" };
    }

    // Verify user has permission
    await ensureUserCanManageOrganization(user.id, organizationId);

    // Enforce vehicle limit based on subscription plan
    const limitInfo = await getVehicleLimitInfo(organizationId);
    if (!limitInfo.canAddMore) {
      return {
        success: false,
        error: `Vehicle limit reached. Your ${limitInfo.planCode ?? "free"} plan allows ${limitInfo.limit} vehicles. Please upgrade to add more.`,
      };
    }

    // Validate input
    const parseResult = vehicleSchema.safeParse({
      branchId,
      title: formData.get("title"),
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      seats: formData.get("seats"),
      fuel: formData.get("fuel"),
      transmission: formData.get("transmission"),
      category: formData.get("category"),
      pricePerDayAud: formData.get("pricePerDayAud"),
      dailyDistanceLimitKm: formData.get("dailyDistanceLimitKm") || null,
      extraDistanceFeeAud: formData.get("extraDistanceFeeAud") || null,
      instantBook: formData.get("instantBook") === "true" || formData.get("instantBook") === "on",
      vin: formData.get("vin") || null,
      licensePlate: formData.get("licensePlate") || null,
      color: formData.get("color") || null,
      hourlyRateAud: formData.get("hourlyRateAud") || null,
      weeklyRateAud: formData.get("weeklyRateAud") || null,
      monthlyRateAud: formData.get("monthlyRateAud") || null,
      weekendRateAud: formData.get("weekendRateAud") || null,
      notes: formData.get("notes") || null,
      features: formData.getAll("features"),
      freeDelivery: formData.get("freeDelivery") === "true" || formData.get("freeDelivery") === "on",
      freeCancellation: formData.get("freeCancellation") === "true" || formData.get("freeCancellation") === "on",
      noHiddenFees: formData.get("noHiddenFees") === "true" || formData.get("noHiddenFees") === "on",
    });

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const field = firstIssue?.path?.join(".") ?? "field";
      const msg = firstIssue?.message ?? "Invalid value";
      return { success: false, error: `${field}: ${msg}` };
    }

    const data = parseResult.data;
    const supabase = createAdminClient();

    // Verify branch belongs to organization and get org status
    const { data: orgData } = await supabase
      .from("organizations")
      .select("status, branches!inner(id)")
      .eq("id", organizationId)
      .eq("branches.id", branchId)
      .single();

    if (!orgData) {
      return { success: false, error: "Invalid branch or organization" };
    }

    let vehicleStatus = orgData.status === "approved" ? "approved" : "pending";
    let isAiApproved = true;
    let aiReason = "";
    let aiSeverity = "medium";

    // Run AI Moderation Check
    if (orgData.status === "approved") {
      const moderation = await evaluateVehicleListing({
        title: data.title,
        make: data.make,
        model: data.model,
        year: data.year,
        category: data.category,
        pricePerDayAud: Number(data.pricePerDayAud),
        notes: data.notes || undefined,
      });

      if (!moderation.isApproved) {
        vehicleStatus = "suspended";
        isAiApproved = false;
        aiReason = moderation.reason;
        aiSeverity = moderation.flagSeverity || "medium";
      }
    }

    // Create vehicle
    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        slug: uniqueSlug(`${data.make} ${data.model} ${data.year}`),
        title: data.title,
        make: data.make,
        model: data.model,
        year: data.year,
        seats: data.seats,
        fuel: data.fuel,
        transmission: data.transmission,
        category: data.category,
        price_per_day_aud: data.pricePerDayAud,
        daily_distance_limit_km: data.dailyDistanceLimitKm,
        extra_distance_fee_aud: data.extraDistanceFeeAud,
        instant_book: data.instantBook,
        vin: data.vin,
        license_plate: data.licensePlate,
        color: data.color,
        hourly_rate_aud: data.hourlyRateAud,
        weekly_rate_aud: data.weeklyRateAud,
        monthly_rate_aud: data.monthlyRateAud,
        weekend_rate_aud: data.weekendRateAud,
        notes: data.notes,
        status: vehicleStatus,
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.includes("idx_vehicles_vin_org") || error.message.includes("vehicles_vin_organization_id_key")) {
        return { success: false, error: "This VIN is already registered to another vehicle in your fleet." };
      }
      if (error.message.includes("idx_vehicles_plate_org") || error.message.includes("vehicles_license_plate_organization_id_key")) {
        return { success: false, error: "This License Plate is already registered to another vehicle in your fleet." };
      }
      return { success: false, error: `Failed to create vehicle: ${error.message}` };
    }

    // Create a fraud flag if AI rejected the listing
    if (!isAiApproved) {
      await supabase.from("fraud_flags").insert({
        resource_type: "vehicle",
        resource_id: vehicle.id,
        severity: aiSeverity,
        reason: `AI Moderation Auto-Suspension: ${aiReason}`,
        status: "open",
      }).then(({ error: e }) => { if (e) console.warn("fraud_flags insert failed:", e.message); });
    }

    // Persist selected features (vehicle_features is a (vehicle_id, feature) join table)
    if (data.features && data.features.length > 0) {
      const featureRows = data.features.map((feature) => ({ vehicle_id: vehicle.id, feature }));
      await supabase.from("vehicle_features").insert(featureRows)
        .then(({ error: e }) => { if (e) console.warn("vehicle_features insert failed:", e.message); });
    }

    // Create search index job (fire and forget - don't fail on this)
    await supabase.from("search_index_jobs").insert({
      vehicle_id: vehicle.id,
      operation: "upsert",
      status: "pending",
    }).then(({ error: e }) => { if (e) console.warn("search_index_jobs insert failed:", e.message); });

    // Log audit event (fire and forget - don't fail on this)
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "vehicle_created",
      resource_type: "vehicle",
      resource_id: vehicle.id,
      metadata: { organization_id: organizationId, branch_id: branchId },
    }).then(({ error: e }) => { if (e) console.warn("audit_logs insert failed:", e.message); });

    // Handle temporary uploaded images
    const tempImagePathsJson = formData.get("tempImagePaths") as string;
    if (tempImagePathsJson) {
      try {
        const tempImagePaths = JSON.parse(tempImagePathsJson);
        if (Array.isArray(tempImagePaths) && tempImagePaths.length > 0) {
          const newImages = tempImagePaths.map((path: string, index: number) => ({
            vehicle_id: vehicle.id,
            storage_path: path,
            alt_text: "",
            sort_order: index,
            approved: orgData.status === "approved",
          }));
          await supabase.from("vehicle_images").insert(newImages);
        }
      } catch (err) {
        console.warn("Failed to parse tempImagePaths", err);
      }
    }

    revalidatePath("/vendor/vehicles");
    revalidatePath("/vendor/dashboard");
    await invalidatePseoForVehicle(supabase, vehicle.id);

    return { success: true, vehicleId: vehicle.id };
  } catch (err) {
    console.error("createVehicle error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}

export async function updateVehicle(formData: FormData): Promise<VehicleActionResult> {
  const user = await requireUser();

  const vehicleId = formData.get("vehicleId") as string;
  const organizationId = formData.get("organizationId") as string;

  if (!vehicleId || !organizationId) {
    return { success: false, error: "Vehicle ID and organization are required" };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  // Validate input
  const parseResult = vehicleSchema.partial().safeParse({
    branchId: formData.get("branchId") || undefined,
    title: formData.get("title") || undefined,
    make: formData.get("make") || undefined,
    model: formData.get("model") || undefined,
    year: formData.get("year") || undefined,
    seats: formData.get("seats") || undefined,
    fuel: formData.get("fuel") || undefined,
    transmission: formData.get("transmission") || undefined,
    category: formData.get("category") || undefined,
    pricePerDayAud: formData.get("pricePerDayAud") || undefined,
    dailyDistanceLimitKm: formData.get("dailyDistanceLimitKm") || null,
    extraDistanceFeeAud: formData.get("extraDistanceFeeAud") || null,
    instantBook: formData.has("instantBook") ? (formData.get("instantBook") === "true" || formData.get("instantBook") === "on") : undefined,
    vin: formData.get("vin") || undefined,
    licensePlate: formData.get("licensePlate") || undefined,
    color: formData.get("color") || undefined,
    hourlyRateAud: formData.get("hourlyRateAud") || undefined,
    weeklyRateAud: formData.get("weeklyRateAud") || undefined,
    monthlyRateAud: formData.get("monthlyRateAud") || undefined,
    weekendRateAud: formData.get("weekendRateAud") || undefined,
    notes: formData.get("notes") || undefined,
    // The vehicle form always renders these controls, so an unchecked box
    // (absent from FormData) correctly means "off"/empty, not "unchanged".
    features: formData.getAll("features"),
    freeDelivery: formData.get("freeDelivery") === "true" || formData.get("freeDelivery") === "on",
    freeCancellation: formData.get("freeCancellation") === "true" || formData.get("freeCancellation") === "on",
    noHiddenFees: formData.get("noHiddenFees") === "true" || formData.get("noHiddenFees") === "on",
  });

  if (!parseResult.success) {
    return { success: false, error: "Invalid vehicle data: " + parseResult.error.message };
  }

  const data = parseResult.data;
  const supabase = createAdminClient();

  // Verify vehicle belongs to organization and get current org status
  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id, branch_id, status, title, make, model, year, category, price_per_day_aud, notes, organizations!inner(status)")
    .eq("id", vehicleId)
    .eq("organization_id", organizationId)
    .single();

  if (!existingVehicle) {
    return { success: false, error: "Vehicle not found or does not belong to your organization" };
  }

  const isOrgApproved = (existingVehicle.organizations as unknown as { status: string }).status === "approved";

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (data.title) updateData.title = data.title;
  if (data.make) updateData.make = data.make;
  if (data.model) updateData.model = data.model;
  if (data.year) updateData.year = data.year;
  if (data.seats) updateData.seats = data.seats;
  if (data.fuel) updateData.fuel = data.fuel;
  if (data.transmission) updateData.transmission = data.transmission;
  if (data.category) updateData.category = data.category;
  if (data.pricePerDayAud) updateData.price_per_day_aud = data.pricePerDayAud;
  if (data.dailyDistanceLimitKm !== undefined) updateData.daily_distance_limit_km = data.dailyDistanceLimitKm;
  if (data.extraDistanceFeeAud !== undefined) updateData.extra_distance_fee_aud = data.extraDistanceFeeAud;
  if (data.instantBook !== undefined) updateData.instant_book = data.instantBook;
  if (data.vin !== undefined) updateData.vin = data.vin;
  if (data.licensePlate !== undefined) updateData.license_plate = data.licensePlate;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.hourlyRateAud !== undefined) updateData.hourly_rate_aud = data.hourlyRateAud;
  if (data.weeklyRateAud !== undefined) updateData.weekly_rate_aud = data.weeklyRateAud;
  if (data.monthlyRateAud !== undefined) updateData.monthly_rate_aud = data.monthlyRateAud;
  if (data.weekendRateAud !== undefined) updateData.weekend_rate_aud = data.weekendRateAud;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.branchId) {
    // Verify new branch belongs to organization
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("id", data.branchId)
      .eq("organization_id", organizationId)
      .single();

    if (!branch) {
      return { success: false, error: "Invalid branch for this organization" };
    }
    updateData.branch_id = data.branchId;
  }

  // SECURITY: If vehicle was approved and material fields are changed, revert to pending for re-approval
  // Material fields: title, make, model, year, category, price
  const materialFields = ["title", "make", "model", "year", "category", "price_per_day_aud"];
  const hasMaterialChanges = materialFields.some((field) => field in updateData);

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();

    let aiRejectionReason = "";
    let aiSeverity = "medium";

    // Re-evaluate material changes with AI
    if (isOrgApproved && hasMaterialChanges) {
      const moderation = await evaluateVehicleListing({
        title: updateData.title as string ?? existingVehicle.title,
        make: updateData.make as string ?? existingVehicle.make,
        model: updateData.model as string ?? existingVehicle.model,
        year: updateData.year as number ?? existingVehicle.year,
        category: updateData.category as string ?? existingVehicle.category,
        pricePerDayAud: Number(updateData.price_per_day_aud ?? existingVehicle.price_per_day_aud),
        notes: updateData.notes as string ?? existingVehicle.notes,
      });

      if (!moderation.isApproved) {
        updateData.status = "suspended";
        aiRejectionReason = moderation.reason;
        aiSeverity = moderation.flagSeverity || "medium";
      } else {
        updateData.status = "approved";
        updateData.suspended_at = null;
      }
    } else if (isOrgApproved) {
      updateData.status = "approved";
      updateData.suspended_at = null;
    } else {
      if (existingVehicle.status === "approved" && hasMaterialChanges) {
        updateData.status = "pending";
        updateData.suspended_at = null;
      }
    }

    const { error } = await supabase.from("vehicles").update(updateData).eq("id", vehicleId);

    if (error) {
      if (error.message.includes("idx_vehicles_vin_org") || error.message.includes("vehicles_vin_organization_id_key")) {
        return { success: false, error: "This VIN is already registered to another vehicle in your fleet." };
      }
      if (error.message.includes("idx_vehicles_plate_org") || error.message.includes("vehicles_license_plate_organization_id_key")) {
        return { success: false, error: "This License Plate is already registered to another vehicle in your fleet." };
      }
      return { success: false, error: `Failed to update vehicle: ${error.message}` };
    }

    // Create search index job
    await supabase.from("search_index_jobs").insert({
      vehicle_id: vehicleId,
      operation: existingVehicle.status === "approved" && hasMaterialChanges ? "delete" : "upsert",
      status: "pending",
    });

    // Create fraud flag for admin attention
    if (aiRejectionReason) {
      await supabase.from("fraud_flags").insert({
        resource_type: "vehicle",
        resource_id: vehicleId,
        severity: aiSeverity,
        reason: `AI Moderation Auto-Suspension on Update: ${aiRejectionReason}`,
        status: "open",
      });
    } else if (existingVehicle.status === "approved" && hasMaterialChanges && !isOrgApproved) {
      await supabase.from("fraud_flags").insert({
        resource_type: "vehicle",
        resource_id: vehicleId,
        severity: "low",
        reason: `Vehicle reverted to pending after material update by pending vendor. Fields changed: ${Object.keys(updateData).filter(k => materialFields.includes(k)).join(", ")}`,
        status: "open",
      });
    }
  }

  // Replace the vehicle's feature set (the form always submits the full set, so
  // an empty array correctly clears all features).
  if (data.features !== undefined) {
    await supabase.from("vehicle_features").delete().eq("vehicle_id", vehicleId);
    if (data.features.length > 0) {
      const featureRows = data.features.map((feature) => ({ vehicle_id: vehicleId, feature }));
      const { error: featErr } = await supabase.from("vehicle_features").insert(featureRows);
      if (featErr) console.warn("vehicle_features update failed:", featErr.message);
    }
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "vehicle_updated",
    resource_type: "vehicle",
    resource_id: vehicleId,
    metadata: { organization_id: organizationId, updated_fields: Object.keys(updateData) },
  });

  // Handle temporary uploaded images
  const tempImagePathsJson = formData.get("tempImagePaths") as string;
  if (tempImagePathsJson) {
    try {
      const tempImagePaths = JSON.parse(tempImagePathsJson);
      if (Array.isArray(tempImagePaths) && tempImagePaths.length > 0) {
        const { data: existingImages } = await supabase
          .from("vehicle_images")
          .select("sort_order")
          .eq("vehicle_id", vehicleId)
          .order("sort_order", { ascending: false })
          .limit(1);
          
        let nextSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1;

        const newImages = tempImagePaths.map((path: string) => {
          const img = {
            vehicle_id: vehicleId,
            storage_path: path,
            alt_text: "",
            sort_order: nextSortOrder,
            approved: isOrgApproved,
          };
          nextSortOrder++;
          return img;
        });
        await supabase.from("vehicle_images").insert(newImages);
      }
    } catch (err) {
      console.warn("Failed to parse tempImagePaths", err);
    }
  }

  revalidatePath("/vendor/vehicles");
  revalidatePath(`/vendor/vehicles/${vehicleId}`);
  await invalidatePseoForVehicle(supabase, vehicleId);

  return { success: true, vehicleId };
}

export async function deleteVehicle(formData: FormData): Promise<VehicleActionResult> {
  const user = await requireUser();

  const vehicleId = formData.get("vehicleId") as string;
  const organizationId = formData.get("organizationId") as string;

  if (!vehicleId || !organizationId) {
    return { success: false, error: "Vehicle ID and organization are required" };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify vehicle belongs to organization
  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("organization_id", organizationId)
    .single();

  if (!existingVehicle) {
    return { success: false, error: "Vehicle not found or does not belong to your organization" };
  }

  // Fetch image paths BEFORE deleting so we can clean up storage later
  const { data: images } = await supabase
    .from("vehicle_images")
    .select("id, storage_path, approved")
    .eq("vehicle_id", vehicleId);

  // Delete vehicle FIRST. DB will handle cascading deletions for vehicle_images, leads, etc.
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    return { success: false, error: `Failed to delete vehicle: ${error.message}` };
  }

  // Only if DB deletion succeeds, delete from storage
  if (images && images.length > 0) {
    const approvedPaths = images.filter((img) => img.approved).map((img) => img.storage_path);
    const pendingPaths = images.filter((img) => !img.approved).map((img) => img.storage_path);

    if (approvedPaths.length > 0) {
      const { error: storageError } = await supabase.storage.from("vehicle-images").remove(approvedPaths);
      if (storageError) {
        console.error("Failed to delete approved images from storage after vehicle deletion:", storageError);
      }
    }

    if (pendingPaths.length > 0) {
      const { error: storageError } = await supabase.storage.from("pending-vehicle-images").remove(pendingPaths);
      if (storageError) {
        console.error("Failed to delete pending images from storage after vehicle deletion:", storageError);
      }
    }
  }

  // Create search index job for deletion
  await supabase.from("search_index_jobs").insert({
    vehicle_id: vehicleId,
    operation: "delete",
    status: "pending",
  });

  await invalidatePseoForVehicle(supabase, vehicleId);

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "vehicle_deleted",
    resource_type: "vehicle",
    resource_id: vehicleId,
    metadata: { organization_id: organizationId },
  });

  revalidatePath("/vendor/vehicles");
  revalidatePath("/vendor/dashboard");

  return { success: true, vehicleId };
}

export async function getVehicleFeatures(vehicleId: string, organizationId: string): Promise<string[]> {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicle_features")
    .select("feature")
    .eq("vehicle_id", vehicleId);

  return (data ?? []).map((row) => row.feature as string);
}

export async function getOrganizationVehicles(organizationId: string, page: number = 1, pageSize: number = 50) {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data: vehicles, error, count } = await supabase
    .from("vehicles")
    .select("*, branches(name, city, state)", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    throw new Error(`Failed to fetch vehicles: ${error.message}`);
  }

  return { vehicles: vehicles ?? [], totalCount: count ?? 0, page, pageSize };
}
