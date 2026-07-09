import { NextResponse, type NextRequest } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/security/auth";
import { sendLeadAlert } from "@/lib/email/ses";
import { clientIp, hashIpForStorage } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { contactEventSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const ipHash = hashIpForStorage(ip);
  const limit = await rateLimitSlidingWindow(`contact:${ip}`, 30, 60_000);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many contact events" }, { status: 429 });
  }

  const { data: rawBody, response: jsonError } = await readJsonBody(request);
  if (jsonError) return jsonError;

  const payload = contactEventSchema.safeParse(rawBody);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Always record the anonymous click for vendor analytics.
  const { error: clickError } = await supabase.from("contact_clicks").insert({
    vehicle_id: payload.data.vehicleId,
    vendor_id: payload.data.vendorId,
    channel: payload.data.channel,
    ip_hash: ipHash,
  });

  if (clickError) {
    return NextResponse.json({ error: "Unable to track contact event" }, { status: 500 });
  }

  // 2. If a logged-in customer initiated the contact, upgrade it from an
  //    anonymous counter into a real, trackable lead so the vendor gets an
  //    actionable record + notification (not just a tally).
  const user = await getCurrentUser();
  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single();

      if (profile?.email) {
        // Confirm the vehicle is real/approved and belongs to this vendor.
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("id, title, branch_id, organization_id")
          .eq("id", payload.data.vehicleId)
          .eq("organization_id", payload.data.vendorId)
          .eq("status", "approved")
          .single();

        if (vehicle) {
          // Don't duplicate a lead created in the last hour for this vehicle.
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("vehicle_id", vehicle.id)
            .eq("customer_email", profile.email)
            .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (!existing) {
            const { data: branch } = await supabase
              .from("branches")
              .select("city")
              .eq("id", vehicle.branch_id)
              .single();

            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + 1);
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 4);

            const channelLabel = payload.data.channel === "whatsapp" ? "WhatsApp" : "phone";

            const { data: lead } = await supabase
              .from("leads")
              .insert({
                vehicle_id: vehicle.id,
                vendor_id: payload.data.vendorId,
                customer_name: profile.full_name || "Interested customer",
                customer_email: profile.email,
                customer_phone: profile.phone || "Not provided",
                pickup_city: branch?.city || "Unknown",
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                message: `Customer started a ${channelLabel} conversation about this vehicle.`,
                ip_hash: ipHash,
                status: "new",
              })
              .select("id")
              .single();

            if (lead) {
              await supabase.from("lead_events").insert({
                lead_id: lead.id,
                event_type: `${payload.data.channel}_contact_initiated`,
                metadata: { ip_hash: ipHash, user_id: user.id },
              });

              // Notify the vendor by email (best-effort, non-blocking failure).
              const { data: organization } = await supabase
                .from("organizations")
                .select("billing_email")
                .eq("id", payload.data.vendorId)
                .single();

              if (organization?.billing_email) {
                try {
                  await sendLeadAlert({
                    to: organization.billing_email,
                    vehicleTitle: vehicle.title,
                    customerName: profile.full_name || "A customer",
                  });
                } catch (emailErr) {
                  console.error("[contact-events] lead created but email failed:", emailErr);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      // A lead-creation failure must never break the click-to-chat flow.
      console.error("[contact-events] failed to create lead from contact click:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
