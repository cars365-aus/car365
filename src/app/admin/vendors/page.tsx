import Link from "next/link";
import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { AdminVendorsTable } from "./vendors-table";
import { moderateVendor } from "../actions";

export const metadata = {
  title: "Vendor Moderation",
};

interface AdminVendorsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}


export default async function AdminVendorsPage({ searchParams }: AdminVendorsPageProps) {
  await requireAdminRole(["moderator", "super_admin"]);
  const params = await searchParams;
  const supabase = createAdminClient();

  // Fetch vendors
  const statusFilter = params.status || "pending";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: vendors, error } = await supabase
    .from("organizations")
    .select(
      `
      id, name, slug, abn, billing_email, website, phone, address, status, created_at, suspended_at,
      branches(id, name, city, status),
      organization_members(user_id, profiles(full_name))
    `,
    )
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch vendors: ${error.message}`);
  }

  // Count by status
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: suspendedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  const counts = {
    pending: pendingCount ?? 0,
    approved: approvedCount ?? 0,
    suspended: suspendedCount ?? 0,
    rejected: rejectedCount ?? 0,
  };

  // Transform vendors for the DataTable
  const tableData = (vendors ?? []).map((vendor) => {
    const branches = (vendor.branches as unknown as { id: string; name: string; city: string; status: string }[]) ?? [];
    const members = (vendor.organization_members as unknown as { user_id: string; profiles: { full_name: string } }[]) ?? [];
    const owner = members[0]?.profiles?.full_name ?? "Unknown";

    return {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      abn: vendor.abn,
      billing_email: vendor.billing_email ?? "",
      phone: vendor.phone ?? "",
      owner,
      branchCount: branches.length,
      status: vendor.status as string,
      created_at: vendor.created_at,
      suspended_at: vendor.suspended_at as string | null,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Vendor Moderation</h1>
        <p className="mt-2 text-muted-foreground">
          Approve, reject, suspend, and manage vendor organizations. All actions are logged to the audit trail.
        </p>
      </section>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "approved", label: "Approved", count: counts.approved },
          { key: "suspended", label: "Suspended", count: counts.suspended },
          { key: "rejected", label: "Rejected", count: counts.rejected },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/vendors?status=${tab.key}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge
                variant={statusFilter === tab.key ? "default" : "outline"}
                className="ml-2"
              >
                {tab.count}
              </Badge>
            )}
          </Link>
        ))}
      </div>

      {/* Vendors Table */}
      <AdminVendorsTable
        data={tableData}
        statusFilter={statusFilter}
        moderateVendor={moderateVendor}
      />
      
      {/* Basic Pagination Controls */}
      <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
        <div>
          Showing page {page}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/vendors?status=${statusFilter}&page=${page - 1}`}
              className="px-4 py-2 border rounded hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          {tableData.length === pageSize && (
            <Link
              href={`/admin/vendors?status=${statusFilter}&page=${page + 1}`}
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
