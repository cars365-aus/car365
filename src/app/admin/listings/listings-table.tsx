"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";

interface ListingRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  fuel: string;
  transmission: string;
  seats: number;
  price_per_day_aud: number;
  status: string;
  vendor_name: string;
  vendor_slug: string;
  vendor_status: string;
  branch_name: string;
  branch_city: string;
  branch_state: string;
  created_at: string;
  suspended_at: string | null;
}

interface AdminListingsTableProps {
  data: ListingRow[];
  statusFilter: string;
  moderateListing: (action: string, listingId: string, reason: string, reindex: boolean) => Promise<void>;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved": return "badge-glow-success";
    case "pending": return "badge-glow-warning";
    case "suspended": return "badge-glow-destructive";
    case "rejected": return "badge-glow-destructive";
    default: return "bg-slate-100 text-slate-600";
  }
};

export function AdminListingsTable({ data, statusFilter, moderateListing }: AdminListingsTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.vendor_name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.branch_city.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "title",
      label: "Vehicle",
      sortable: true,
      render: (_val, row) => (
        <div>
          <div className="font-medium text-foreground">{row.title as string}</div>
          <div className="text-xs text-muted-foreground">
            {row.category as string} · {row.fuel as string} · {row.transmission as string}
          </div>
        </div>
      ),
    },
    {
      key: "price_per_day_aud",
      label: "Price/Day",
      sortable: true,
      render: (val) => <span className="font-medium">${val as number}</span>,
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (_val, row) => (
        <div>
          <Link href={`/vendors/${row.vendor_slug}`} className="text-primary hover:underline text-sm">
            {row.vendor_name as string}
          </Link>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${statusBadgeVariant(row.vendor_status as string)}`}>
              {row.vendor_status as string}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "branch_city",
      label: "Location",
      sortable: true,
      render: (_val, row) => (
        <span className="text-sm text-muted-foreground">
          {row.branch_name as string} · {row.branch_city as string}, {row.branch_state as string}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Submitted",
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
                action={moderateListing.bind(null, "approve", row.id as string, "Approved from admin dashboard", true)}
                label="Approve"
                loadingLabel="Approving"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 rounded-xl px-4"
              />
              <ActionButton 
                action={moderateListing.bind(null, "reject", row.id as string, "Rejected from admin dashboard", false)}
                label="Reject"
                loadingLabel="Rejecting"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl px-4"
              />
            </>
          )}
          {row.status === "approved" && (
            <>
              <ActionButton 
                action={moderateListing.bind(null, "suspend", row.id as string, "Suspended from admin dashboard", false)}
                label="Suspend"
                loadingLabel="Suspending"
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl px-4"
              />
              <Link href={`/cars/${row.slug}`} target="_blank">
                <Button variant="ghost" size="sm" className="rounded-xl">View</Button>
              </Link>
            </>
          )}
          {(row.status === "suspended" || row.status === "rejected") && (
            <ActionButton 
              action={moderateListing.bind(null, "restore", row.id as string, "Restored from admin dashboard", true)}
              label="Restore"
              loadingLabel="Restoring"
              className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm rounded-xl px-4"
            />
          )}
          <Link href={`/admin/audit?type=vehicle&id=${row.id}`}>
            <Button variant="ghost" size="sm">Audit</Button>
          </Link>
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
          placeholder="Search by vehicle, vendor, category, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/50 p-12 text-center glass-panel">
          <p className="text-slate-500 font-medium">No {statusFilter} listings found.</p>
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
