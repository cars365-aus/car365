"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const uploadImageSchema = z.object({
  vehicleId: z.string().uuid(),
  organizationId: z.string().uuid(),
  altText: z.string().max(200).optional().default(""),
});

const uploadTempImageSchema = z.object({
  organizationId: z.string().uuid(),
});

export type ImageActionResult =
  | { success: true; imageId: string; path: string }
  | { success: false; error: string };

export async function uploadVehicleImage(
  formData: FormData,
): Promise<ImageActionResult> {
  const user = await requireUser();

  const vehicleId = formData.get("vehicleId") as string;
  const organizationId = formData.get("organizationId") as string;
  const altText = (formData.get("altText") as string) || "";
  const file = formData.get("file") as File | null;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large. Maximum size is 10MB." };
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    };
  }

  // Validate other inputs
  const parsed = uploadImageSchema.safeParse({ vehicleId, organizationId, altText });
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.message };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify vehicle belongs to organization and get org status
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, status, organizations!inner(status)")
    .eq("id", vehicleId)
    .eq("organization_id", organizationId)
    .single();

  if (vehicleError || !vehicle) {
    return { success: false, error: "Vehicle not found or access denied" };
  }

  // Generate storage path: pending-vehicle-images/{organizationId}/{vehicleId}/{timestamp}-{filename}
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${organizationId}/${vehicleId}/${timestamp}-${sanitizedFilename}`;

  const isOrgApproved = (vehicle.organizations as unknown as { status: string }).status === "approved";
  const bucketName = isOrgApproved ? "vehicle-images" : "pending-vehicle-images";

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Get current max sort order
  const { data: existingImages } = await supabase
    .from("vehicle_images")
    .select("sort_order")
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1;

  // Create database record (pending approval)
  const { data: imageRecord, error: dbError } = await supabase
    .from("vehicle_images")
    .insert({
      vehicle_id: vehicleId,
      storage_path: storagePath,
      alt_text: altText,
      sort_order: nextSortOrder,
      approved: isOrgApproved,
    })
    .select("id")
    .single();

  if (dbError) {
    // Try to clean up the uploaded file
    await supabase.storage.from(bucketName).remove([storagePath]);
    return { success: false, error: `Database error: ${dbError.message}` };
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "vehicle_image_uploaded",
    resource_type: "vehicle_image",
    resource_id: imageRecord.id,
    metadata: {
      vehicle_id: vehicleId,
      organization_id: organizationId,
      file_name: sanitizedFilename,
      file_size: file.size,
    },
  });

  // Create fraud flag for moderation queue if this is a new vehicle AND vendor is not approved
  if (vehicle.status === "pending" && !isOrgApproved) {
    await supabase.from("fraud_flags").insert({
      resource_type: "vehicle_image",
      resource_id: imageRecord.id,
      severity: "low",
      reason: "New vehicle image requires moderation",
      status: "open",
    });
  }

  revalidatePath(`/vendor/vehicles`);
  revalidatePath(`/vendor/vehicles/${vehicleId}`);

  return {
    success: true,
    imageId: imageRecord.id,
    path: storagePath,
  };
}

export async function uploadTempVehicleImage(
  formData: FormData,
): Promise<{ success: true; path: string; url: string } | { success: false; error: string }> {
  const user = await requireUser();

  const organizationId = formData.get("organizationId") as string;
  const file = formData.get("file") as File | null;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large. Maximum size is 10MB." };
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    };
  }

  const parsed = uploadTempImageSchema.safeParse({ organizationId });
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.message };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Fetch organization status to determine the correct bucket
  const { data: orgData } = await supabase
    .from("organizations")
    .select("status")
    .eq("id", organizationId)
    .single();

  const isApproved = orgData?.status === "approved";
  const bucketName = isApproved ? "vehicle-images" : "pending-vehicle-images";

  // Generate storage path: {organizationId}/temp_{timestamp}_{filename}
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${organizationId}/temp_${timestamp}-${sanitizedFilename}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Get signed URL for instant preview
  const { data } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, 3600);

  return {
    success: true,
    path: storagePath,
    url: data?.signedUrl || "",
  };
}

export async function deleteTempVehicleImage(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const path = formData.get("path") as string;
  const organizationId = formData.get("organizationId") as string;

  if (!path || !organizationId) {
    return { success: false, error: "Missing required fields" };
  }

  await ensureUserCanManageOrganization(user.id, organizationId);
  const supabase = createAdminClient();

  // Make sure it's a temp image to avoid deleting approved ones via this endpoint
  if (!path.includes("temp_")) {
    return { success: false, error: "Can only delete temporary images" };
  }

  // Fetch organization status to determine the correct bucket
  const { data: orgData } = await supabase
    .from("organizations")
    .select("status")
    .eq("id", organizationId)
    .single();

  const isApproved = orgData?.status === "approved";
  const bucketName = isApproved ? "vehicle-images" : "pending-vehicle-images";

  const { error } = await supabase.storage.from(bucketName).remove([path]);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteVehicleImage(formData: FormData): Promise<ImageActionResult> {
  const user = await requireUser();

  const imageId = formData.get("imageId") as string;
  const organizationId = formData.get("organizationId") as string;

  if (!imageId || !organizationId) {
    return { success: false, error: "Image ID and organization are required" };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Get image record with vehicle info
  const { data: image, error: imageError } = await supabase
    .from("vehicle_images")
    .select("id, storage_path, vehicle_id, approved, vehicles!inner(organization_id)")
    .eq("id", imageId)
    .single();

  if (imageError || !image) {
    return { success: false, error: "Image not found" };
  }

  // Verify vehicle belongs to organization
  const vehicleOrgId = (image.vehicles as unknown as { organization_id: string }).organization_id;
  if (vehicleOrgId !== organizationId) {
    return { success: false, error: "Access denied" };
  }

  // Delete from storage
  const bucket = image.approved ? "vehicle-images" : "pending-vehicle-images";
  await supabase.storage.from(bucket).remove([image.storage_path]);

  // Delete database record
  const { error: deleteError } = await supabase.from("vehicle_images").delete().eq("id", imageId);

  if (deleteError) {
    return { success: false, error: `Delete failed: ${deleteError.message}` };
  }

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "vehicle_image_deleted",
    resource_type: "vehicle_image",
    resource_id: imageId,
    metadata: {
      vehicle_id: image.vehicle_id,
      organization_id: organizationId,
    },
  });

  revalidatePath(`/vendor/vehicles`);
  revalidatePath(`/vendor/vehicles/${image.vehicle_id}`);

  return { success: true, imageId, path: image.storage_path };
}

export async function reorderVehicleImages(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();

  const vehicleId = formData.get("vehicleId") as string;
  const organizationId = formData.get("organizationId") as string;
  const order = formData.get("order") as string; // JSON array of image IDs in new order

  if (!vehicleId || !organizationId || !order) {
    return { success: false, error: "Missing required fields" };
  }

  let imageOrder: string[];
  try {
    imageOrder = JSON.parse(order);
    if (!Array.isArray(imageOrder)) throw new Error("Invalid order format");
  } catch {
    return { success: false, error: "Invalid order format" };
  }

  // Verify user has permission
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("organization_id", organizationId)
    .single();

  if (!vehicle) {
    return { success: false, error: "Vehicle not found or access denied" };
  }

  // Update sort orders
  const updates = imageOrder.map((imageId, index) =>
    supabase.from("vehicle_images").update({ sort_order: index }).eq("id", imageId).eq("vehicle_id", vehicleId),
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    return { success: false, error: "Some images could not be reordered" };
  }

  revalidatePath(`/vendor/vehicles`);
  revalidatePath(`/vendor/vehicles/${vehicleId}`);

  return { success: true };
}

export async function getVehicleImages(vehicleId: string, organizationId: string) {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();

  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("organization_id", organizationId)
    .single();

  if (!vehicle) {
    throw new Error("Vehicle not found or access denied");
  }

  const { data: images, error } = await supabase
    .from("vehicle_images")
    .select("id, storage_path, alt_text, sort_order, approved, created_at")
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`);
  }

  // Generate signed URLs for images
  const imagesWithUrls = await Promise.all(
    (images ?? []).map(async (img) => {
      const bucket = img.approved ? "vehicle-images" : "pending-vehicle-images";
      const { data } = await supabase.storage.from(bucket).createSignedUrl(img.storage_path, 3600);

      return {
        ...img,
        url: data?.signedUrl || null,
      };
    }),
  );

  return imagesWithUrls;
}
