"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export type AdminLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  vehicle_title: string;
  created_at: string;
};

export function AdminLeadsTable({ data }: { data: AdminLead[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-foreground">No leads found</h3>
        <p className="mt-2 text-muted-foreground">When customers submit enquiries, they will appear here.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/50 text-xs uppercase text-foreground">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Customer</th>
              <th scope="col" className="px-6 py-4 font-medium">Type</th>
              <th scope="col" className="px-6 py-4 font-medium">Vehicle</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
              <th scope="col" className="px-6 py-4 font-medium">Received</th>
              <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {data.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-foreground">{lead.name}</div>
                  <div className="text-xs">{lead.phone || lead.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {getTypeLabel(lead.type)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {lead.vehicle_title !== "N/A" ? lead.vehicle_title : <span className="text-muted-foreground italic">General</span>}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status.toUpperCase()}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="text-primary hover:text-primary-hover hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
