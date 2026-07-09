"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";

interface VendorRow {
  id: string;
  name: string;
  slug: string;
  abn: string;
  billing_email: string;
  phone: string;
  owner: string;
  branchCount: number;
  status: string;
  created_at: string;
  suspended_at: string | null;
}

interface AdminVendorsTableProps {
  data: VendorRow[];
  statusFilter: string;
  moderateVendor: (action: string, vendorId: string, reason: string) => Promise<void>;
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

export function AdminVendorsTable({ data, statusFilter, moderateVendor }: AdminVendorsTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.abn.toLowerCase().includes(q) ||
        v.billing_email.toLowerCase().includes(q) ||
        v.owner.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Vendor",
      sortable: true,
      render: (_val, row) => (
        <div>
          <div className="font-medium text-foreground">{row.name as string}</div>
          <div className="text-xs text-muted-foreground">ABN: {row.abn as string}</div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
    },
    {
      key: "billing_email",
      label: "Email",
      sortable: true,
    },
    {
      key: "branchCount",
      label: "Branches",
      sortable: true,
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
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${statusBadgeVariant(val as string)}`}>
          {val as string}
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
                action={moderateVendor.bind(null, "approve", row.id as string, "Approved from admin dashboard")}
                label="Approve"
                loadingLabel="Approving"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 rounded-xl px-4"
              />
              <ActionButton 
                action={moderateVendor.bind(null, "reject", row.id as string, "Rejected from admin dashboard")}
                label="Reject"
                loadingLabel="Rejecting"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl px-4"
              />
            </>
          )}
          {row.status === "approved" && (
            <ActionButton 
              action={moderateVendor.bind(null, "suspend", row.id as string, "Suspended from admin dashboard")}
              label="Suspend"
              loadingLabel="Suspending"
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl px-4"
            />
          )}
          {(row.status === "suspended" || row.status === "rejected") && (
            <ActionButton 
              action={moderateVendor.bind(null, "restore", row.id as string, "Restored from admin dashboard")}
              label="Restore"
              loadingLabel="Restoring"
              className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm rounded-xl px-4"
            />
          )}
          <Link href={`/admin/audit?type=vendor&id=${row.id}`}>
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
          placeholder="Search vendors by name, ABN, email, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/50 p-12 text-center glass-panel">
          <p className="text-slate-500 font-medium">No {statusFilter} vendors found.</p>
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
