"use server";

// redirect removed
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/security/auth";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { z } from "zod";

const profileSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(8).max(30).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().trim().min(6).max(240).optional().or(z.literal("")),
});

export async function updateOrganizationProfile(prevState: any, formData: FormData) {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    website: formData.get("website") || "",
    address: formData.get("address") || "",
  });

  if (!parsed.success) {
    return { error: "Invalid form data. Please check your inputs.", success: false };
  }

  const { organizationId, name, phone, website, address } = parsed.data;

  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      phone: phone || null,
      website: website || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    return { error: `Failed to update organization: ${error.message}`, success: false };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "organization_profile_updated",
    resource_type: "organization",
    resource_id: organizationId,
    metadata: { fields: ["name", "phone", "website", "address"] },
  });

  revalidatePath("/vendor/settings");
  return { success: true, error: null };
}

export async function updateBrandProfile(prevState: any, formData: FormData) {
  const user = await requireUser();
  const organizationId = formData.get("organizationId") as string;
  const bio = formData.get("bio") as string;
  const logo = formData.get("logo") as File | null;

  if (!organizationId) return { error: "Missing organization ID" };

  await ensureUserCanManageOrganization(user.id, organizationId);
  const supabase = createAdminClient();

  let logoUrl: string | undefined = undefined;

  if (logo && logo.size > 0) {
    if (logo.size > 2 * 1024 * 1024) {
      return { error: "Logo must be less than 2MB" };
    }

    const ext = logo.name.split(".").pop() ?? "png";
    const path = `logos/${organizationId}-${Date.now()}.${ext}`;

    // Upload to a generic public bucket (e.g. vendor-documents or vehicle-images)
    // we use vehicle-images since it's already configured as public in the DB
    const buffer = await logo.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(path, buffer, { 
        upsert: true,
        contentType: logo.type,
      });

    if (uploadError) {
      return { error: `Failed to upload logo: ${uploadError.message}` };
    }

    const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path);
    logoUrl = data.publicUrl;
  }

  const updates: any = {};
  if (bio !== undefined) updates.bio = bio;
  if (logoUrl !== undefined) updates.logo_url = logoUrl;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", organizationId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/vendor/settings");
  return { success: true, error: null };
}

export async function uploadVendorDocument(formData: FormData) {
  const user = await requireUser();
  const organizationId = String(formData.get("organizationId") ?? "");
  const documentType = String(formData.get("documentType") ?? "abn_certificate");
  const file = formData.get("file") as File | null;

  if (!organizationId || !file?.size) {
    throw new Error("Organization and file are required.");
  }

  await ensureUserCanManageOrganization(user.id, organizationId);

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${organizationId}/${documentType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("vendor-documents")
    .upload(path, file, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: dbError } = await supabase.from("vendor_documents").insert({
    organization_id: organizationId,
    document_type: documentType,
    storage_path: path,
    status: "pending",
  });

  if (dbError) {
    throw new Error(dbError.message);
  }

  revalidatePath("/vendor/settings");
}
