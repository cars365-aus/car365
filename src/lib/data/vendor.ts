import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type VendorContext = {
  setupError?: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    abn: string;
    branches: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      address: string;
      status: string;
      phone: string | null;
      whatsapp: string | null;
    }>;
  }>;
};

export type VehicleLimitInfo = {
  currentCount: number;
  limit: number | null;
  hasLimit: boolean;
  canAddMore: boolean;
  planCode: string | null;
};

export async function getVehicleLimitInfo(organizationId: string): Promise<VehicleLimitInfo> {
  const supabase = createAdminClient();

  const [countResult, subResult] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("subscriptions").select("plan_code, status").eq("organization_id", organizationId).eq("status", "active").maybeSingle(),
  ]);

  if (countResult.error) {
    throw new Error(`Failed to count vehicles: ${countResult.error.message}`);
  }

  if (subResult.error) {
    throw new Error(`Failed to get subscription: ${subResult.error.message}`);
  }

  const currentCount = countResult.count;
  const subscription = subResult.data;

  // If no active subscription, check for trialing
  let planCode = subscription?.plan_code;
  if (!planCode) {
    const { data: trialing } = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("organization_id", organizationId)
      .eq("status", "trialing")
      .maybeSingle();
    planCode = trialing?.plan_code;
  }

  // Get plan limit
  let limit: number | null = null;
  if (planCode) {
    const { data: plan } = await supabase
      .from("plans")
      .select("vehicle_limit")
      .eq("code", planCode)
      .single();
    limit = plan?.vehicle_limit ?? null;
  } else {
    // If there is no active or trialing plan, the limit is strictly 0.
    limit = 0;
  }

  // null limit means unlimited (enterprise/business plans)
  const hasLimit = limit !== null;
  const canAddMore = !hasLimit || (currentCount ?? 0) < (limit ?? 0);

  return {
    currentCount: currentCount ?? 0,
    limit,
    hasLimit,
    canAddMore,
    planCode: planCode ?? null,
  };
}

export async function enforceVehicleLimit(organizationId: string): Promise<void> {
  const limitInfo = await getVehicleLimitInfo(organizationId);

  if (!limitInfo.canAddMore) {
    throw new Error(
      `Vehicle limit reached. Your ${limitInfo.planCode} plan allows ${limitInfo.limit} vehicles. ` +
        `Please upgrade your plan to add more vehicles.`,
    );
  }
}

export const getVendorContext = cache(async function getVendorContext(userId: string): Promise<VendorContext> {
  const supabase = createAdminClient();

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId);

  if (error) {
    return {
      organizations: [],
      setupError:
        "Database tables are not available yet. Apply the Supabase migration before using vendor workflows.",
    };
  }

  const organizationIds = memberships?.map((item) => item.organization_id) ?? [];

  if (organizationIds.length === 0) {
    return { organizations: [] };
  }

  const [orgResult, branchResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, status, abn")
      .in("id", organizationIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("branches")
      .select("id, organization_id, name, city, state, address, status, phone, whatsapp")
      .in("organization_id", organizationIds)
      .order("created_at", { ascending: true }),
  ]);

  if (orgResult.error || branchResult.error) {
    console.error("Organizations fetch error:", orgResult.error);
    console.error("Branches fetch error:", branchResult.error);
    return {
      organizations: [],
      setupError: "Failed to load vendor data. Please try again or contact support."
    };
  }

  const organizations = orgResult.data;
  const branches = branchResult.data;

  return {
    organizations:
      organizations?.map((organization) => ({
        ...organization,
        branches:
          (branches || [])
            .filter((branch) => branch.organization_id === organization.id)
            .map((branch) => ({
              id: branch.id,
              name: branch.name,
              city: branch.city,
              state: branch.state,
              address: branch.address,
              status: branch.status,
              phone: branch.phone,
              whatsapp: branch.whatsapp,
            })),
      })) ?? [],
  };
});

export async function ensureUserCanManageOrganization(
  userId: string,
  organizationId: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin", "manager"])
    .maybeSingle();

  if (error || !data) {
    throw new Error("You do not have permission to manage this organization.");
  }
}

export type LeadWithVehicle = {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupCity: string;
  startDate: string;
  endDate: string;
  message: string | null;
  status: "new" | "contacted" | "converted" | "lost";
  createdAt: string;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    actorName?: string;
  }>;
};

export async function getOrganizationLeads(
  organizationId: string,
  userId: string,
  options: {
    status?: "new" | "contacted" | "converted" | "lost";
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ leads: LeadWithVehicle[]; total: number }> {
  await ensureUserCanManageOrganization(userId, organizationId);

  const supabase = createAdminClient();
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("leads")
    .select(
      `
      id,
      vehicle_id,
      vehicles(title),
      customer_name,
      customer_email,
      customer_phone,
      pickup_city,
      start_date,
      end_date,
      message,
      status,
      created_at,
      lead_events(id, event_type, created_at, profiles(full_name))
    `,
      { count: "exact" },
    )
    .eq("vendor_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  const leads: LeadWithVehicle[] =
    data?.map((lead) => {
      const vehicle = lead.vehicles as unknown as { title: string } | null;
      const events = (lead.lead_events as unknown as Array<{
        id: string;
        event_type: string;
        created_at: string;
        profiles: { full_name: string } | null;
      }>) ?? [];

      return {
        id: lead.id,
        vehicleId: lead.vehicle_id,
        vehicleTitle: vehicle?.title ?? "Unknown Vehicle",
        customerName: lead.customer_name,
        customerEmail: lead.customer_email,
        customerPhone: lead.customer_phone,
        pickupCity: lead.pickup_city,
        startDate: lead.start_date,
        endDate: lead.end_date,
        message: lead.message,
        status: lead.status as LeadWithVehicle["status"],
        createdAt: lead.created_at,
        events: events.map((e) => ({
          id: e.id,
          eventType: e.event_type,
          createdAt: e.created_at,
          actorName: e.profiles?.full_name ?? undefined,
        })),
      };
    }) ?? [];

  return { leads, total: count ?? 0 };
}

export async function getLeadStats(organizationId: string, userId: string) {
  await ensureUserCanManageOrganization(userId, organizationId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .select("status")
    .eq("vendor_id", organizationId);

  if (error) {
    throw new Error(`Failed to fetch lead stats: ${error.message}`);
  }

  const stats = {
    total: data?.length ?? 0,
    new: data?.filter((l) => l.status === "new").length ?? 0,
    contacted: data?.filter((l) => l.status === "contacted").length ?? 0,
    converted: data?.filter((l) => l.status === "converted").length ?? 0,
    lost: data?.filter((l) => l.status === "lost").length ?? 0,
  };

  return stats;
}

export type DashboardMetrics = {
  vehicleCount: number;
  activeListings: number;
  pendingListings: number;
  newLeads: number;
  totalLeads: number;
  planLimit: number | null;
  planCode: string | null;
  planUsage: string;
  branchCount: number;
  clickStats: {
    phone: number;
    whatsapp: number;
    total: number;
  };
  totalViews: number;
};

export async function getDashboardMetrics(
  organizationId: string,
  userId: string,
): Promise<DashboardMetrics> {
  await ensureUserCanManageOrganization(userId, organizationId);

  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    vehiclesRes,
    newLeadsRes,
    totalLeadsRes,
    limitInfo,
    branchRes,
    clicksRes
  ] = await Promise.all([
    supabase.from("vehicles").select("status, views_count").eq("organization_id", organizationId),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("vendor_id", organizationId).eq("status", "new"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("vendor_id", organizationId),
    getVehicleLimitInfo(organizationId),
    supabase.from("branches").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("contact_clicks").select("channel").eq("vendor_id", organizationId).gte("created_at", thirtyDaysAgo)
  ]);

  if (vehiclesRes.error) throw new Error(`Failed to fetch vehicles: ${vehiclesRes.error.message}`);
  if (newLeadsRes.error) throw new Error(`Failed to fetch leads: ${newLeadsRes.error.message}`);
  if (totalLeadsRes.error) throw new Error(`Failed to fetch total leads: ${totalLeadsRes.error.message}`);
  if (branchRes.error) throw new Error(`Failed to fetch branches: ${branchRes.error.message}`);
  if (clicksRes.error) throw new Error(`Failed to fetch clicks: ${clicksRes.error.message}`);

  const vehicles = vehiclesRes.data;
  const newLeadsCount = newLeadsRes.count;
  const totalLeadsCount = totalLeadsRes.count;
  const branchCount = branchRes.count;
  const clicks = clicksRes.data;

  const totalViews = vehicles?.reduce((acc, v) => acc + (v.views_count || 0), 0) ?? 0;
  const phoneClicks = clicks?.filter((c) => c.channel === "phone").length ?? 0;
  const whatsappClicks = clicks?.filter((c) => c.channel === "whatsapp").length ?? 0;

  const activeListings = vehicles?.filter((v) => v.status === "approved").length ?? 0;
  const pendingListings = vehicles?.filter((v) => v.status === "pending").length ?? 0;

  return {
    vehicleCount: vehicles?.length ?? 0,
    activeListings,
    pendingListings,
    newLeads: newLeadsCount ?? 0,
    totalLeads: totalLeadsCount ?? 0,
    planLimit: limitInfo.limit,
    planCode: limitInfo.planCode,
    planUsage: limitInfo.hasLimit
      ? `${limitInfo.currentCount} / ${limitInfo.limit}`
      : `${limitInfo.currentCount} / ∞`,
    branchCount: branchCount ?? 0,
    clickStats: {
      phone: phoneClicks,
      whatsapp: whatsappClicks,
      total: (clicks?.length ?? 0),
    },
    totalViews,
  };
}
