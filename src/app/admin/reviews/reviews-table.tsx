"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Star } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";

interface ReviewRow {
  id: string;
  customer_name: string;
  rating: number;
  body: string;
  status: string;
  vendor_name: string;
  vendor_slug: string;
  vehicle_title: string;
  created_at: string;
}

interface AdminReviewsTableProps {
  data: ReviewRow[];
  statusFilter: string;
  moderateReview: (action: string, reviewId: string, reason: string) => Promise<void>;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved": return "badge-glow-success";
    case "pending": return "badge-glow-warning";
    case "rejected": return "badge-glow-destructive";
    default: return "bg-slate-100 text-slate-600";
  }
};

export function AdminReviewsTable({ data, statusFilter, moderateReview }: AdminReviewsTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.customer_name.toLowerCase().includes(q) ||
        r.vendor_name.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "customer_name",
      label: "Reviewer",
      sortable: true,
      render: (val) => <span className="font-medium text-foreground">{val as string}</span>,
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{val as number}/5</span>
        </div>
      ),
    },
    {
      key: "body",
      label: "Review",
      render: (val) => (
        <p className="max-w-xs truncate text-sm text-muted-foreground">{val as string}</p>
      ),
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (_val, row) => (
        <Link href={`/vendors/${row.vendor_slug}`} className="text-primary hover:underline text-sm">
          {row.vendor_name as string}
        </Link>
      ),
    },
    {
      key: "vehicle_title",
      label: "Vehicle",
      sortable: true,
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {new Date(val as string).toLocaleDateString("en-AU")}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          {row.status === "pending" && (
            <>
              <ActionButton 
                action={moderateReview.bind(null, "approve", row.id as string, "Approved from admin dashboard")}
                label="Approve"
                loadingLabel="Approving"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 rounded-xl px-4"
              />
              <ActionButton 
                action={moderateReview.bind(null, "reject", row.id as string, "Rejected from admin dashboard")}
                label="Reject"
                loadingLabel="Rejecting"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl px-4"
              />
            </>
          )}
          {row.status !== "pending" && (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBadgeVariant(row.status as string)}`}>
              {row.status as string}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter control */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by reviewer, vendor, or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/50 p-12 text-center glass-panel">
          <p className="text-slate-500 font-medium">No {statusFilter} reviews found.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border-white/40 shadow-xl overflow-hidden bg-white/50">
          <DataTable
            columns={columns}
            data={filteredData as unknown as Record<string, unknown>[]}
            pageSize={20}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}
    </div>
  );
}
