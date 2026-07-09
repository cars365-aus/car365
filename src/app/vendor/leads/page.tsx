import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext, getOrganizationLeads, getLeadStats } from "@/lib/data/vendor";
import { updateLeadStatus } from "./actions";
import { RealtimeLeadsListener } from "@/components/realtime-leads-listener";
import { OrgSwitcher } from "@/components/vendor/org-switcher";
import { organizationHasFeature } from "@/lib/plan-features";
import { MessageSquare, Mail, Phone, MapPin, Calendar, ChevronRight, Inbox } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Leads",
};

interface LeadsPageProps {
  searchParams: Promise<{ org?: string; status?: string; page?: string }>;
}

const statusConfig = {
  new: { label: "New", bg: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  contacted: { label: "Contacted", bg: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  converted: { label: "Converted", bg: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  lost: { label: "Lost", bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
} as const;

export default async function VendorLeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const context = await getVendorContext(user.id);

  if (context.setupError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-800">Setup Required</h1>
        <p className="mt-2 text-red-700">{context.setupError}</p>
      </div>
    );
  }

  if (context.organizations.length === 0) {
    redirect("/vendor/upgrade");
  }

  const selectedOrgId = params.org || context.organizations[0]?.id;
  const organization = context.organizations.find((o) => o.id === selectedOrgId);

  if (!organization) {
    redirect("/vendor/leads?org=" + context.organizations[0]?.id);
  }

  const statusFilter = params.status as "new" | "contacted" | "converted" | "lost" | undefined;
  const page = parseInt(params.page || "1", 10);
  const perPage = 20;

  const supabase = createAdminClient();
  const [{ leads, total }, stats, { data: whatsappLeads }] = await Promise.all([
    getOrganizationLeads(selectedOrgId, user.id, {
      status: statusFilter,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    getLeadStats(selectedOrgId, user.id),
    supabase
      .from("whatsapp_leads")
      .select("id, sender_name, sender_phone, message_body, created_at")
      .eq("vendor_id", selectedOrgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const hasRealtime = await organizationHasFeature(selectedOrgId, "realtimeLeads");

  return (
    <div className="space-y-6">
      {hasRealtime && <RealtimeLeadsListener organizationId={selectedOrgId} />}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              Customer enquiries for <span className="font-medium text-slate-700">{organization.name}</span>
            </p>
          </div>
          <OrgSwitcher
            organizations={context.organizations}
            selectedOrgId={selectedOrgId}
            basePath="/vendor/leads"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-50 border-slate-200 text-slate-900" },
          { label: "New", value: stats.new, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Contacted", value: stats.contacted, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Converted", value: stats.converted, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Lost", value: stats.lost, color: "bg-slate-50 border-slate-200 text-slate-500" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 text-center ${stat.color}`}>
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All leads", value: undefined },
          { label: "New", value: "new" as const },
          { label: "Contacted", value: "contacted" as const },
          { label: "Converted", value: "converted" as const },
          { label: "Lost", value: "lost" as const },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/vendor/leads?org=${selectedOrgId}&status=${value}` : `/vendor/leads?org=${selectedOrgId}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              statusFilter === value
                ? "bg-slate-950 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* WhatsApp Leads */}
      {whatsappLeads && whatsappLeads.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-green-600 font-black">WA</span>
            Recent WhatsApp leads
          </h2>
          <div className="space-y-3">
            {whatsappLeads.map((wa) => (
              <div key={wa.id} className="rounded-xl border border-green-100 bg-white p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{wa.sender_name || "WhatsApp user"}</p>
                    <a href={`https://wa.me/${wa.sender_phone.replace(/\D/g, "")}`} className="text-sm text-green-700 hover:underline">
                      {wa.sender_phone}
                    </a>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{wa.message_body}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(wa.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Inbox className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">
              {statusFilter ? `No ${statusFilter} leads found` : "No leads yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter ? "Try viewing all leads." : "Enquiries from customers will appear here."}
            </p>
          </div>
        ) : (
          leads.map((lead) => {
            const sc = statusConfig[lead.status as keyof typeof statusConfig] ?? statusConfig.new;
            return (
              <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Lead Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{lead.customerName}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Interested in: <span className="font-medium text-slate-700">{lead.vehicleTitle}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <a href={`mailto:${lead.customerEmail}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {lead.customerEmail}
                      </a>
                      <a href={`tel:${lead.customerPhone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {lead.customerPhone}
                      </a>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {lead.pickupCity}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(lead.startDate).toLocaleDateString("en-AU")} – {new Date(lead.endDate).toLocaleDateString("en-AU")}
                      </span>
                    </div>

                    {lead.message && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600 italic">
                        &ldquo;{lead.message}&rdquo;
                      </div>
                    )}

                    {lead.events.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="space-y-1.5">
                          {lead.events.slice(0, 3).map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                              <span className="capitalize text-slate-500">{event.eventType.replace(/_/g, " ")}</span>
                              <span>·</span>
                              <span>{new Date(event.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              {event.actorName && <><span>·</span><span>{event.actorName}</span></>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-3 lg:w-56 shrink-0">
                    <Link
                      href={`/vendor/leads/${lead.id}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Chat
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Link>

                    <form action={updateLeadStatus} className="flex flex-col gap-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="organizationId" value={selectedOrgId} />
                      <label className="sr-only" htmlFor={`status-${lead.id}`}>Update status</label>
                      <select
                        id={`status-${lead.id}`}
                        name="status"
                        defaultValue={lead.status}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                      <label className="sr-only" htmlFor={`notes-${lead.id}`}>Add a note</label>
                      <input
                        id={`notes-${lead.id}`}
                        type="text"
                        name="notes"
                        placeholder="Add a note (optional)"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        Update Status
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/vendor/leads?org=${selectedOrgId}${statusFilter ? `&status=${statusFilter}` : ""}&page=${page - 1}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-slate-500">
            Page <span className="font-semibold text-slate-900">{page}</span> of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/vendor/leads?org=${selectedOrgId}${statusFilter ? `&status=${statusFilter}` : ""}&page=${page + 1}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
