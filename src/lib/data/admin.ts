import { createAdminClient } from "@/lib/supabase/admin";

export type AdminDashboardMetrics = {
  // Vendor moderation
  pendingVendors: number;
  totalVendors: number;
  suspendedVendors: number;

  // Listing moderation
  pendingListings: number;
  totalListings: number;
  suspendedListings: number;

  // Fraud & abuse
  openFraudFlags: number;
  totalFraudFlags: number;
  newFraudFlagsToday: number;

  // Webhooks
  failedWebhooks: number;
  totalWebhooks: number;
  webhooksLast24h: number;

  // Platform activity
  totalLeads: number;
  leadsToday: number;
  totalReviews: number;
  pendingReviews: number;

  // Subscriptions
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  revenueEstimate: number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_metrics");

  if (error) {
    throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
  }

  return {
    pendingVendors: data.pendingVendors ?? 0,
    totalVendors: data.totalVendors ?? 0,
    suspendedVendors: data.suspendedVendors ?? 0,
    pendingListings: data.pendingListings ?? 0,
    totalListings: data.totalListings ?? 0,
    suspendedListings: data.suspendedListings ?? 0,
    openFraudFlags: data.openFraudFlags ?? 0,
    totalFraudFlags: data.totalFraudFlags ?? 0,
    newFraudFlagsToday: data.newFraudFlagsToday ?? 0,
    failedWebhooks: data.failedWebhooks ?? 0,
    totalWebhooks: data.totalWebhooks ?? 0,
    webhooksLast24h: data.webhooksLast24h ?? 0,
    totalLeads: data.totalLeads ?? 0,
    leadsToday: data.leadsToday ?? 0,
    totalReviews: data.totalReviews ?? 0,
    pendingReviews: data.pendingReviews ?? 0,
    activeSubscriptions: data.activeSubscriptions ?? 0,
    pastDueSubscriptions: data.pastDueSubscriptions ?? 0,
    revenueEstimate: data.revenueEstimate ?? 0,
  };
}

export type PendingVendor = {
  id: string;
  name: string;
  slug: string;
  abn: string;
  email: string;
  website: string | null;
  phone: string;
  address: string;
  createdAt: string;
  branchCount: number;
};

export async function getPendingVendors(page = 1, pageSize = 50): Promise<PendingVendor[]> {
  const supabase = createAdminClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: vendors, error } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug,
      abn,
      billing_email,
      website,
      phone,
      address,
      created_at,
      branches(id)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch pending vendors: ${error.message}`);
  }

  return (
    vendors?.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      abn: v.abn,
      email: v.billing_email ?? "",
      website: v.website,
      phone: v.phone ?? "",
      address: v.address ?? "",
      createdAt: v.created_at,
      branchCount: (v.branches as unknown as { id: string }[])?.length ?? 0,
    })) ?? []
  );
}

export type PendingListing = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  vendorName: string;
  vendorId: string;
  branchName: string;
  createdAt: string;
};

export async function getPendingListings(page = 1, pageSize = 50): Promise<PendingListing[]> {
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select(
      `
      id,
      title,
      make,
      model,
      year,
      category,
      price_per_day_aud,
      organization_id,
      branch_id,
      created_at,
      organizations(name),
      branches(name)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch pending listings: ${error.message}`);
  }

  return (
    vehicles?.map((v) => ({
      id: v.id,
      title: v.title,
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      pricePerDay: v.price_per_day_aud,
      vendorId: v.organization_id,
      vendorName: (v.organizations as unknown as { name: string })?.name ?? "Unknown",
      branchName: (v.branches as unknown as { name: string })?.name ?? "Unknown",
      createdAt: v.created_at,
    })) ?? []
  );
}

export type FraudFlagWithDetails = {
  id: string;
  resourceType: string;
  resourceId: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  status: "open" | "reviewing" | "closed";
  createdAt: string;
  // Additional details based on type
  vendorName?: string;
  vehicleTitle?: string;
};

export async function getOpenFraudFlags(page = 1, pageSize = 50): Promise<FraudFlagWithDetails[]> {
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // We should fix N+1 by using left joins or fetching related data more efficiently.
  // Unfortunately Supabase RPC or complex joins are required for multi-table polymorphism.
  // Instead, let's fetch flags and then batch fetch the orgs and vehicles.
  const { data: flags, error } = await supabase
    .from("fraud_flags")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch fraud flags: ${error.message}`);
  }
  
  if (!flags || flags.length === 0) return [];

  // Batch fetch Orgs
  const orgIds = flags
    .filter(f => f.resource_type === 'vendor' || f.resource_type === 'organization')
    .map(f => f.resource_id);
    
  const vehicleIds = flags
    .filter(f => f.resource_type === 'vehicle' || f.resource_type === 'lead_attempt')
    .map(f => f.resource_id);

  const orgsPromise = orgIds.length > 0 
    ? supabase.from("organizations").select("id, name").in("id", orgIds)
    : Promise.resolve({ data: [] });
    
  const vehiclesPromise = vehicleIds.length > 0
    ? supabase.from("vehicles").select("id, title, organizations(name)").in("id", vehicleIds)
    : Promise.resolve({ data: [] });

  const [orgsRes, vehiclesRes] = await Promise.all([orgsPromise, vehiclesPromise]);
  const orgMap = new Map(orgsRes.data?.map(o => [o.id, o.name]) ?? []);
  const vehicleMap = new Map(vehiclesRes.data?.map(v => [v.id, v]) ?? []);

  const enrichedFlags: FraudFlagWithDetails[] = flags.map((flag) => {
    let vendorName: string | undefined;
    let vehicleTitle: string | undefined;

    if (flag.resource_type === "vendor" || flag.resource_type === "organization") {
      vendorName = orgMap.get(flag.resource_id);
    } else if (flag.resource_type === "vehicle" || flag.resource_type === "lead_attempt") {
      const vData = vehicleMap.get(flag.resource_id);
      vehicleTitle = vData?.title;
      vendorName = (vData?.organizations as unknown as { name: string })?.name;
    }

    return {
      id: flag.id,
      resourceType: flag.resource_type,
      resourceId: flag.resource_id,
      severity: flag.severity as FraudFlagWithDetails["severity"],
      reason: flag.reason,
      status: flag.status as FraudFlagWithDetails["status"],
      createdAt: flag.created_at,
      vendorName,
      vehicleTitle,
    };
  });

  return enrichedFlags;
}

export type PendingReview = {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  vendorName: string;
  vendorId: string;
  vehicleTitle: string | null;
  createdAt: string;
};

export async function getPendingReviews(page = 1, pageSize = 50): Promise<PendingReview[]> {
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      customer_name,
      rating,
      body,
      organization_id,
      vehicle_id,
      created_at,
      organizations(name),
      vehicles(title)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch pending reviews: ${error.message}`);
  }

  return (
    reviews?.map((r) => ({
      id: r.id,
      customerName: r.customer_name,
      rating: r.rating,
      body: r.body,
      vendorId: r.organization_id,
      vendorName: (r.organizations as unknown as { name: string })?.name ?? "Unknown",
      vehicleTitle: (r.vehicles as unknown as { title: string })?.title ?? null,
      createdAt: r.created_at,
    })) ?? []
  );
}
export async function getHistoricalAnalytics() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_historical_analytics");

  if (error) {
    throw new Error(`Failed to fetch historical analytics: ${error.message}`);
  }

  return {
    leadsData: data.leadsData ?? [],
    revenueData: data.revenueData ?? []
  };
}
