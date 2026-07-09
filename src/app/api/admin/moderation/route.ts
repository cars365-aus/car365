import { NextResponse, type NextRequest } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";
import { requireApiAdmin } from "@/lib/security/auth";
import { moderationSchema } from "@/lib/validation/schemas";
import {
  buildModerationUpdate,
  getFraudFlagModerationStatus,
  isModerationActionAllowed,
  moderationTableMap,
  type ModerationResourceType,
} from "@/lib/moderation";
import { sendVendorApprovalEmail, sendVehicleApprovalEmail } from "@/lib/email/ses";

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiAdmin();
  if (!user) return response;

  const { data: rawBody, response: jsonError } = await readJsonBody(request);
  if (jsonError) return jsonError;

  const payload = moderationSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const { resourceType, resourceId, action, reason } = payload.data;
  const supabase = createAdminClient();

  // Get the table name for this resource type
  const tableName = moderationTableMap[resourceType];
  if (!tableName) {
    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
  }

  // Execute moderation action based on resource type
  switch (resourceType) {
    case "vendor":
    case "branch":
    case "vehicle":
    case "review": {
      if (!isModerationActionAllowed(resourceType, action)) {
        return NextResponse.json({ error: "Invalid action for this resource type" }, { status: 400 });
      }

      const updateData = buildModerationUpdate(
        resourceType as Exclude<ModerationResourceType, "fraud_flag">,
        action,
      );

      if (!updateData) {
        return NextResponse.json({ error: "Invalid action for this resource type" }, { status: 400 });
      }

      const { error } = await supabase.from(tableName).update(updateData).eq("id", resourceId);

      if (error) {
        return NextResponse.json(
          { error: `Failed to update ${resourceType}: ${error.message}` },
          { status: 500 },
        );
      }

      // For vehicles, trigger search index update
      if (resourceType === "vehicle") {
        await supabase.from("search_index_jobs").insert({
          vehicle_id: resourceId,
          operation: action === "approve" || action === "restore" ? "upsert" : "delete",
          status: "pending",
        });
        if (action === "approve" || action === "restore") {
          await invalidatePseoForVehicle(supabase, resourceId);
        }
        if (action === "approve") {
          // Fetch vehicle details and vendor email
          const { data: v } = await supabase
            .from("vehicles")
            .select("title, organization_id")
            .eq("id", resourceId)
            .single();
          if (v) {
            const { data: org } = await supabase
              .from("organizations")
              .select("billing_email")
              .eq("id", v.organization_id)
              .single();
            if (org?.billing_email) {
              await sendVehicleApprovalEmail({ to: org.billing_email, vehicleTitle: v.title });
            }
          }
        }
      }

      // For vendors (organizations), if approving, also approve their branches
      if (resourceType === "vendor" && action === "approve") {
        // Enforce that vendors must have a billing email before approval
        const { data: org } = await supabase
          .from("organizations")
          .select("billing_email, name")
          .eq("id", resourceId)
          .single();
          
        if (!org?.billing_email) {
          return NextResponse.json(
            { error: "Cannot approve vendor: No billing email configured. Leads cannot be delivered." },
            { status: 400 }
          );
        }

        await supabase
          .from("branches")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("organization_id", resourceId)
          .eq("status", "pending");

        await sendVendorApprovalEmail({ to: org.billing_email, vendorName: org.name });
      }
      break;
    }

    case "fraud_flag": {
      // Update fraud flag status
      const flagStatus = getFraudFlagModerationStatus(action);
      if (!flagStatus) {
        return NextResponse.json({ error: "Invalid action for this resource type" }, { status: 400 });
      }

      const { error } = await supabase
        .from("fraud_flags")
        .update({ status: flagStatus })
        .eq("id", resourceId);

      if (error) {
        return NextResponse.json(
          { error: `Failed to update fraud flag: ${error.message}` },
          { status: 500 },
        );
      }
      break;
    }
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: resourceType,
    resource_id: resourceId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: { reason, previous_action: action },
  });

  return NextResponse.json({ ok: true, resourceType, resourceId, action });
}
