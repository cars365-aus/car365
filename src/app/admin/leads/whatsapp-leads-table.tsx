"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";

interface WhatsAppLeadRow {
  id: string;
  sender_name: string;
  sender_phone: string;
  message_preview: string;
  reply_variant: "in_hours" | "away";
  notified_status: string;
  created_at: string;
}

interface WhatsAppLeadsTableProps {
  data: WhatsAppLeadRow[];
}

const notifiedBadgeVariant = (status: string) => {
  switch (status) {
    case "sent":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export function WhatsAppLeadsTable({ data }: WhatsAppLeadsTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (l) =>
        l.sender_name.toLowerCase().includes(q) ||
        l.sender_phone.includes(q) ||
        l.message_preview.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "sender_name",
      label: "Sender",
      sortable: true,
      render: (val, row) => (
        <Link
          href={`/admin/whatsapp/leads/${row.id as string}`}
          className="font-medium text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
        >
          {val as string}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>
      ),
    },
    {
      key: "sender_phone",
      label: "Phone",
      sortable: true,
      render: (val) => (
        <span className="font-mono text-sm text-muted-foreground">{val as string}</span>
      ),
    },
    {
      key: "message_preview",
      label: "Message",
      sortable: false,
      render: (val) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate block">
          {val as string || "—"}
        </span>
      ),
    },
    {
      key: "reply_variant",
      label: "Variant",
      sortable: true,
      render: (val) => (
        <Badge
          variant={val === "in_hours" ? "success" : "info"}
          className="capitalize"
        >
          {val === "in_hours" ? "In Hours" : "Away"}
        </Badge>
      ),
    },
    {
      key: "notified_status",
      label: "Notified",
      sortable: true,
      render: (val) => (
        <Badge variant={notifiedBadgeVariant(val as string)} className="capitalize">
          {val as string}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Received",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {new Date(val as string).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
          placeholder="Search by name, phone, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No WhatsApp leads found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData as unknown as Record<string, unknown>[]}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </div>
  );
}
