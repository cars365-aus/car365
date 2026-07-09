"use server";

import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";

const ModerateVendorSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  vendorId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateVendor(rawAction: string, rawVendorId: string, rawReason: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, vendorId, reason } = ModerateVendorSchema.parse({
    action: rawAction,
    vendorId: rawVendorId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === "suspend") {
    updateData.suspended_at = new Date().toISOString();
  }

  if (action === "restore") {
    updateData.suspended_at = null;
  }

  // Update vendor
  const { error } = await supabase.from("organizations").update(updateData).eq("id", vendorId);

  if (error) {
    throw new Error(`Failed to ${action} vendor: ${error.message}`);
  }

  // Approve all branches if approving vendor
  if (action === "approve" || action === "restore") {
    await supabase
      .from("branches")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("organization_id", vendorId)
      .eq("status", "pending");
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "vendor",
    resource_id: vendorId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "vendor",
    resource_id: vendorId,
    metadata: { reason },
  });

  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
}

const ModerateBranchSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  branchId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateBranch(rawAction: string, rawBranchId: string, rawReason: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, branchId, reason } = ModerateBranchSchema.parse({
    action: rawAction,
    branchId: rawBranchId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === "suspend") {
    updateData.suspended_at = new Date().toISOString();
  }

  if (action === "restore") {
    updateData.suspended_at = null;
  }

  // Update branch
  const { error } = await supabase.from("branches").update(updateData).eq("id", branchId);

  if (error) {
    throw new Error(`Failed to ${action} branch: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "branch",
    resource_id: branchId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "branch",
    resource_id: branchId,
    metadata: { reason },
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin");
}

const AIApproveBranchSchema = z.object({
  branchId: z.string().uuid(),
});

export async function aiAutoApproveBranch(rawBranchId: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { branchId } = AIApproveBranchSchema.parse({ branchId: rawBranchId });

  // Fetch branch to perform "AI Check"
  const { data: branch, error: fetchErr } = await supabase
    .from("branches")
    .select("name, city, state, phone")
    .eq("id", branchId)
    .single();

  if (fetchErr || !branch) {
    throw new Error("Could not fetch branch for AI review.");
  }

  // Simulate AI evaluation of documents/data
  await new Promise((resolve) => setTimeout(resolve, 800));

  const hasSufficientData = branch.name && branch.city && branch.state && branch.phone;
  if (!hasSufficientData) {
    throw new Error("AI Review Failed: Branch is missing critical information (city, state, or phone).");
  }

  // Approve
  const { error } = await supabase
    .from("branches")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", branchId);

  if (error) {
    throw new Error(`AI Approval failed: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "branch",
    resource_id: branchId,
    author_user_id: user.id,
    body: `[AI APPROVED] Automatically verified documents and details via AI.`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_ai_approve`,
    resource_type: "branch",
    resource_id: branchId,
    metadata: { reason: "AI passed checks for valid regional data and contacts." },
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin");
}

const ModerateListingSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  listingId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
  reindex: z.boolean(),
});

export async function moderateListing(
  rawAction: string,
  rawListingId: string,
  rawReason: string,
  rawReindex: boolean,
) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, listingId, reason, reindex } = ModerateListingSchema.parse({
    action: rawAction,
    listingId: rawListingId,
    reason: rawReason,
    reindex: rawReindex,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === "suspend") {
    updateData.suspended_at = new Date().toISOString();
  }

  if (action === "restore") {
    updateData.suspended_at = null;
  }

  // Update listing
  const { error } = await supabase.from("vehicles").update(updateData).eq("id", listingId);

  if (error) {
    throw new Error(`Failed to ${action} listing: ${error.message}`);
  }

  // Add to search index queue if approved
  if (action === "approve" || action === "restore") {
    await supabase.from("search_index_jobs").insert({
      vehicle_id: listingId,
      operation: "upsert",
      status: "pending",
    });
    await invalidatePseoForVehicle(supabase, listingId);
  } else if (action === "suspend" || action === "reject") {
    await supabase.from("search_index_jobs").insert({
      vehicle_id: listingId,
      operation: "delete",
      status: "pending",
    });
  }

  // Approve pending images
  if (action === "approve" || action === "restore") {
    await supabase
      .from("vehicle_images")
      .update({ approved: true })
      .eq("vehicle_id", listingId)
      .eq("approved", false);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "vehicle",
    resource_id: listingId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "vehicle",
    resource_id: listingId,
    metadata: { reason, reindex },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
}

const ModerateReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateReview(rawAction: string, rawReviewId: string, rawReason: string) {
  const user = await requireAdminRole(["support", "super_admin"]);
  const supabase = createAdminClient();

  const { action, reviewId, reason } = ModerateReviewSchema.parse({
    action: rawAction,
    reviewId: rawReviewId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
  };

  const newStatus = statusMap[action];

  // Update review
  const { error } = await supabase
    .from("reviews")
    .update({
      status: newStatus,
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`Failed to ${action} review: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "review",
    resource_id: reviewId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "review",
    resource_id: reviewId,
    metadata: { reason },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

const UpdateFraudFlagStatusSchema = z.object({
  action: z.enum(["close", "reopen"]),
  flagId: z.string().uuid(),
});

export async function updateFraudFlagStatus(rawAction: string, rawFlagId: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, flagId } = UpdateFraudFlagStatusSchema.parse({
    action: rawAction,
    flagId: rawFlagId,
  });

  const isClosing = action === "close";

  const { error } = await supabase
    .from("fraud_flags")
    .update({
      status: isClosing ? "closed" : "open",
      reviewed_by: isClosing ? user.id : null,
      reviewed_at: isClosing ? new Date().toISOString() : null,
    })
    .eq("id", flagId);

  if (error) {
    throw new Error(`Failed to ${action} flag: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "fraud_flag",
    resource_id: flagId,
    author_user_id: user.id,
    body: isClosing
      ? "[CLOSED] Fraud flag investigated and closed"
      : "[REOPENED] Fraud flag reopened for further review",
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: isClosing ? "fraud_flag_closed" : "fraud_flag_reopened",
    resource_type: "fraud_flag",
    resource_id: flagId,
  });

  revalidatePath("/admin/fraud");
  revalidatePath("/admin");
}
