import Link from "next/link";
import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { AdminListingsTable } from "./listings-table";
import { moderateListing } from "../actions";

export const metadata = {
  title: "Listing Moderation",
};

interface AdminListingsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}


export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  await requireAdminRole(["moderator", "super_admin"]);
  const params = await searchParams;
  const supabase = createAdminClient();

  // Fetch listings
  const statusFilter = params.status || "pending";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: listings, error } = await supabase
    .from("vehicles")
    .select(
      `
      id, slug, title, make, model, year, category, fuel, transmission, seats,
      price_per_day_aud, status, created_at, suspended_at,
      organizations(id, name, slug, status),
      branches(id, name, city, state, status)
    `,
    )
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  // Count by status
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: suspendedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  const counts = {
    pending: pendingCount ?? 0,
    approved: approvedCount ?? 0,
    suspended: suspendedCount ?? 0,
    rejected: rejectedCount ?? 0,
  };

  // Transform listings for DataTable
  const tableData = (listings ?? []).map((listing) => {
    const org = (listing.organizations as unknown as { id: string; name: string; slug: string; status: string }) ?? {
      name: "Unknown",
      slug: "",
      status: "unknown",
    };
    const branch = (listing.branches as unknown as { name: string; city: string; state: string; status: string }) ?? {
      name: "Unknown",
      city: "Unknown",
      state: "Unknown",
    };

    return {
      id: listing.id,
      slug: listing.slug,
      title: `${listing.year} ${listing.make} ${listing.model}`,
      category: listing.category,
      fuel: listing.fuel,
      transmission: listing.transmission,
      seats: listing.seats,
      price_per_day_aud: listing.price_per_day_aud,
      status: listing.status as string,
      vendor_name: org.name,
      vendor_slug: org.slug,
      vendor_status: org.status,
      branch_name: branch.name,
      branch_city: branch.city,
      branch_state: branch.state,
      created_at: listing.created_at,
      suspended_at: listing.suspended_at as string | null,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Listing Moderation</h1>
        <p className="mt-2 text-muted-foreground">
          Approve, reject, suspend, and manage vehicle listings. Approved listings are added to the search index.
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
            href={`/admin/listings?status=${tab.key}`}
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

      {/* Listings Table */}
      <AdminListingsTable
        data={tableData}
        statusFilter={statusFilter}
        moderateListing={moderateListing}
      />
      
      {/* Basic Pagination Controls */}
      <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
        <div>
          Showing page {page}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/listings?status=${statusFilter}&page=${page - 1}`}
              className="px-4 py-2 border rounded hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          {tableData.length === pageSize && (
            <Link
              href={`/admin/listings?status=${statusFilter}&page=${page + 1}`}
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
