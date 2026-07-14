import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminPendingReminderEmail, sendVendorUnreadLeadReminderEmail } from "@/lib/email/ses";

// This endpoint should be protected by a cron secret in production
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { adminReminded: false, vendorRemindersSent: 0 };

  // 1. Check for Pending Vendors and Vehicles to remind Admin
  const { count: pendingVendors } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: pendingVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if ((pendingVendors && pendingVendors > 0) || (pendingVehicles && pendingVehicles > 0)) {
    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "support@cars365.info";
    await sendAdminPendingReminderEmail({
      to: adminEmail,
      pendingVendorsCount: pendingVendors || 0,
      pendingVehiclesCount: pendingVehicles || 0,
    });
    results.adminReminded = true;
  }

  // 2. Check for Leads with 'new' status (unread/unresponded)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Find leads created before 24h ago that are still 'new'
  const { data: unreadLeads } = await supabase
    .from("leads")
    .select("id, organization_id, organizations(name, billing_email)")
    .eq("status", "new")
    .lt("created_at", twentyFourHoursAgo);

  if (unreadLeads && unreadLeads.length > 0) {
    // Group by organization
    const orgsToRemind = new Map<string, { email: string; name: string; count: number }>();
    
    for (const lead of unreadLeads) {
      const org = lead.organizations as unknown as { name: string; billing_email: string };
      if (!org || !org.billing_email) continue;
      
      if (!orgsToRemind.has(lead.organization_id)) {
        orgsToRemind.set(lead.organization_id, { email: org.billing_email, name: org.name, count: 0 });
      }
      orgsToRemind.get(lead.organization_id)!.count++;
    }

    // Send reminders to vendors
    for (const [orgId, data] of orgsToRemind.entries()) {
      await sendVendorUnreadLeadReminderEmail({
        to: data.email,
        vendorName: data.name,
        unreadCount: data.count,
      });
      results.vendorRemindersSent++;
    }
  }

  return NextResponse.json({ success: true, results });
}
