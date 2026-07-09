import Link from "next/link";
import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { AdminReviewsTable } from "./reviews-table";
import { moderateReview } from "../actions";

export const metadata = {
  title: "Review Moderation",
};

interface AdminReviewsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}


export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  await requireAdminRole(["support", "super_admin"]);
  const params = await searchParams;
  const supabase = createAdminClient();

  // Get counts by status
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  const counts = {
    pending: pendingCount ?? 0,
    approved: approvedCount ?? 0,
    rejected: rejectedCount ?? 0,
  };

  const statusFilter = params.status || "pending";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch reviews
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(
      `
      id, customer_name, rating, body, status, created_at,
      organization_id, vehicle_id,
      organizations(id, name, slug),
      vehicles(id, title)
    `,
    )
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  // Transform for DataTable
  const tableData = (reviews ?? []).map((review) => {
    const org = (review.organizations as unknown as { id: string; name: string; slug: string }) ?? {
      name: "Unknown",
      slug: "",
    };
    const vehicle = (review.vehicles as unknown as { id: string; title: string }) ?? {
      title: null,
    };

    return {
      id: review.id,
      customer_name: review.customer_name,
      rating: review.rating,
      body: review.body,
      status: review.status as string,
      vendor_name: org.name,
      vendor_slug: org.slug,
      vehicle_title: vehicle.title ?? "N/A",
      created_at: review.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Review Moderation</h1>
        <p className="mt-2 text-muted-foreground">
          Moderate customer reviews before they are shown publicly. All reviews are screened for authenticity.
        </p>
      </section>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "approved", label: "Approved", count: counts.approved },
          { key: "rejected", label: "Rejected", count: counts.rejected },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/reviews?status=${tab.key}`}
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

      {/* Reviews Table */}
      <AdminReviewsTable
        data={tableData}
        statusFilter={statusFilter}
        moderateReview={moderateReview}
      />
      
      {/* Basic Pagination Controls */}
      <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
        <div>
          Showing page {page}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/reviews?status=${statusFilter}&page=${page - 1}`}
              className="px-4 py-2 border rounded hover:bg-accent transition-colors"
            >
              Previous
            </Link>
          )}
          {tableData.length === pageSize && (
            <Link
              href={`/admin/reviews?status=${statusFilter}&page=${page + 1}`}
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
