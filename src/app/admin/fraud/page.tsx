import Link from "next/link";
import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFraudTable } from "./fraud-table";
import { updateFraudFlagStatus } from "../actions";

export const metadata = {
  title: "Fraud & Abuse",
};

interface AdminFraudPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}



export default async function AdminFraudPage({ searchParams }: AdminFraudPageProps) {
  await requireAdminRole(["moderator", "super_admin"]);
  const params = await searchParams;
  const supabase = createAdminClient();

  const statusFilter = params.status || "open";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch fraud flags
  const { data: flags, error } = await supabase
    .from("fraud_flags")
    .select(
      `
      id, resource_type, resource_id, severity, reason, status, created_at,
      reviewed_by, reviewed_at,
      profiles(full_name)
    `,
    )
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Fraud Flags Error:", error);
    throw new Error(`Failed to fetch fraud flags: ${error.message}`);
  }

  // Batch fetch resources to avoid N+1
  const orgIds = (flags ?? [])
    .filter(f => f.resource_type === 'vendor' || f.resource_type === 'organization' || f.resource_type === 'lead')
    .map(f => f.resource_id);
    
  const vehicleIds = (flags ?? [])
    .filter(f => f.resource_type === 'vehicle' || f.resource_type === 'lead_attempt')
    .map(f => f.resource_id);

  // We actually need vendor_id for leads. It's complex, let's simplify by using the existing getOpenFraudFlags 
  // Wait, getOpenFraudFlags does not return the reviewer name or status needed here.
  // Let's do the batch fetch here.
  
  const orgsPromise = orgIds.length > 0 
    ? supabase.from("organizations").select("id, name").in("id", orgIds)
    : Promise.resolve({ data: [] });
    
  const vehiclesPromise = vehicleIds.length > 0
    ? supabase.from("vehicles").select("id, title, organization_id, organizations(name)").in("id", vehicleIds)
    : Promise.resolve({ data: [] });

  const leadsPromise = (flags ?? []).some(f => f.resource_type === 'lead')
    ? supabase.from("leads").select("id, vendor_id, organizations(name)").in("id", (flags ?? []).filter(f => f.resource_type === 'lead').map(f => f.resource_id))
    : Promise.resolve({ data: [] });

  const [orgsRes, vehiclesRes, leadsRes] = await Promise.all([orgsPromise, vehiclesPromise, leadsPromise]);
  const orgMap = new Map(orgsRes.data?.map(o => [o.id, o.name]) ?? []);
  const vehicleMap = new Map(vehiclesRes.data?.map(v => [v.id, v]) ?? []);
  const leadMap = new Map(leadsRes.data?.map(l => [l.id, l]) ?? []);

  const enrichedFlags = (flags ?? []).map((flag) => {
    let vendorName: string | null = null;
    let vehicleTitle: string | null = null;
    let vendorId: string | null = null;

    if (flag.resource_type === "vendor" || flag.resource_type === "organization") {
      vendorName = orgMap.get(flag.resource_id) ?? null;
      vendorId = flag.resource_id;
    } else if (flag.resource_type === "vehicle" || flag.resource_type === "lead_attempt") {
      const v = vehicleMap.get(flag.resource_id);
      vehicleTitle = v?.title ?? null;
      vendorId = v?.organization_id ?? null;
      vendorName = (v?.organizations as unknown as { name: string })?.name ?? null;
    } else if (flag.resource_type === "lead") {
      const l = leadMap.get(flag.resource_id);
      vendorId = l?.vendor_id ?? null;
      vendorName = (l?.organizations as unknown as { name: string })?.name ?? null;
    }

    return {
      id: flag.id,
      resource_type: flag.resource_type,
      resource_id: flag.resource_id,
      severity: flag.severity as string,
      reason: flag.reason,
      status: flag.status as string,
      created_at: flag.created_at,
      reviewed_at: flag.reviewed_at as string | null,
      vendor_name: vendorName ?? "Unknown",
      vehicle_title: vehicleTitle ?? "",
      vendor_id: vendorId,
      reviewer: (flag.profiles as unknown as { full_name: string })?.full_name ?? null,
    };
  });

  const [
    { count: openCount },
    { count: reviewingCount },
    { count: closedCount },
  ] = await Promise.all([
    supabase.from("fraud_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("fraud_flags").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
    supabase.from("fraud_flags").select("id", { count: "exact", head: true }).eq("status", "closed"),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Fraud & Abuse</h1>
        <p className="mt-2 text-muted-foreground">
          Investigate suspicious leads, contact-click spikes, duplicate listings, and vendor reports.
        </p>
      </section>

      {/* Summary Cards with Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/fraud?status=open">
          <Card variant="elevated" size="sm" className={`cursor-pointer transition-colors ${statusFilter === 'open' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{openCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">Open Flags</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/fraud?status=reviewing">
          <Card variant="elevated" size="sm" className={`cursor-pointer transition-colors ${statusFilter === 'reviewing' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{reviewingCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/fraud?status=closed">
          <Card variant="elevated" size="sm" className={`cursor-pointer transition-colors ${statusFilter === 'closed' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{closedCount ?? 0}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Fraud Flags Table */}
      <AdminFraudTable
        data={enrichedFlags}
        updateFraudFlagStatus={updateFraudFlagStatus}
      />
      
      {/* Pagination */}
      <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
        <div>
          Showing page {page}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/fraud?status=${statusFilter}&page=${page - 1}`}
              className="px-4 py-2 border rounded hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          {enrichedFlags.length === pageSize && (
            <Link
              href={`/admin/fraud?status=${statusFilter}&page=${page + 1}`}
              className="px-4 py-2 border rounded hover:bg-accent transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
