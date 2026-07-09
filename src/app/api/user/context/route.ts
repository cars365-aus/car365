import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isVendor = (count ?? 0) > 0;

  return NextResponse.json({
    isVendor,
    customerDashboardHref: "/customer/dashboard",
    vendorDashboardHref: "/vendor/dashboard",
    vendorUpgradeHref: "/vendor/upgrade",
    profileHref: isVendor ? "/vendor/dashboard" : "/customer/dashboard",
    profileLabel: isVendor ? "Vendor Dashboard" : "My Account",
    listFleetLabel: "List Your Fleet",
  });
}
