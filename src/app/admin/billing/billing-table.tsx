"use client";

import { useState, useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface BillingRow {
  id: string;
  plan_code: string;
  status: string;
  vendor_name: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

interface AdminBillingTableProps {
  data: BillingRow[];
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "active": return "success" as const;
    case "past_due": return "warning" as const;
    case "canceled": return "destructive" as const;
    case "trialing": return "info" as const;
    default: return "outline" as const;
  }
};

export function AdminBillingTable({ data }: AdminBillingTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (s) =>
        s.vendor_name.toLowerCase().includes(q) ||
        s.plan_code.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
      render: (val) => <span className="font-medium text-foreground">{val as string}</span>,
    },
    {
      key: "plan_code",
      label: "Plan",
      sortable: true,
      render: (val) => (
        <Badge variant="outline" className="capitalize">{val as string}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => (
        <Badge variant={statusBadgeVariant(val as string)}>
          {val as string}
        </Badge>
      ),
    },
    {
      key: "period_start",
      label: "Period Start",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {(val as string) ? new Date(val as string).toLocaleDateString("en-AU") : "—"}
        </span>
      ),
    },
    {
      key: "period_end",
      label: "Period End",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {(val as string) ? new Date(val as string).toLocaleDateString("en-AU") : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {new Date(val as string).toLocaleDateString("en-AU")}
        </span>
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
          placeholder="Search by vendor, plan, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No subscriptions found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData as unknown as Record<string, unknown>[]}
          pageSize={20}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </div>
  );
}
