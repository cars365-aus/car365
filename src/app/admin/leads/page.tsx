import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getLeadList } from "@/lib/data/leads";
import { LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, LEAD_TYPE_LABELS } from "@/lib/leads/status";
import type { LeadStatus } from "@/lib/domain";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = status ?? "all";
  const leads = await getLeadList({ status: active !== "all" ? (active as LeadStatus) : undefined });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">Respond within 15 minutes during business hours.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "all" ? "/admin/leads" : `/admin/leads?status=${t.value}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${active === t.value ? "bg-primary text-primary-foreground" : "border border-border bg-card text-body hover:bg-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Phone</th>
              <th className="p-3">Status</th><th className="p-3">Received</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leads {active !== "all" ? `with status “${active}”` : "yet"}.</td></tr>
            ) : leads.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="p-3 font-medium text-foreground">{l.name}</td>
                <td className="p-3 text-body">{LEAD_TYPE_LABELS[l.type]}</td>
                <td className="p-3 tabular-nums text-body">{l.phone}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LEAD_STATUS_STYLES[l.status]}`}>{LEAD_STATUS_LABELS[l.status]}</span></td>
                <td className="p-3 text-muted-foreground">{formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}</td>
                <td className="p-3 text-right"><Link href={`/admin/leads/${l.id}`} className="text-primary hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
