import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Car, Eye, MessageSquare, ArrowRight, TrendingUp, Plus, Clock } from "lucide-react";
import Link from "next/link";

interface SellerOverviewProps {
  userId: string;
  email: string;
}

export async function SellerOverview({ userId, email }: SellerOverviewProps) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  // Real stats from the database
  const [vehiclesResult, leadsResult, viewsResult] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("vehicles").select("views_count").eq("status", "active"),
  ]);

  const activeListings = vehiclesResult.count ?? 0;
  const totalLeads = leadsResult.count ?? 0;
  const totalViews = viewsResult.data
    ? viewsResult.data.reduce((sum: number, v: any) => sum + (v.views_count ?? 0), 0)
    : 0;

  // Recent leads for activity feed
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("id, name, created_at, status, vehicle_id, vehicles:vehicle_id(title, make, model)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent active vehicles
  const { data: recentVehicles } = await supabase
    .from("vehicles")
    .select("id, title, make, model, slug, price, year, status, views_count, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  const stats = [
    { label: "Active Listings", value: String(activeListings), icon: Car, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Views", value: totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : String(totalViews), icon: Eye, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Total Leads", value: String(totalLeads), icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Seller Dashboard</h1>
          <p className="mt-1 text-slate-400">Manage your inventory and track performance.</p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-5 h-10 text-sm font-bold text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,204,0,0.2)]"
        >
          <Plus className="size-4" /> New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md hover:border-white/20 transition-colors"
          >
            <div className={`mb-3 inline-flex size-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="size-5" />
            </div>
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Recent Leads</h2>
            <Link href="/admin/leads" className="text-xs text-primary hover:underline font-semibold">View all →</Link>
          </div>
          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl hover:bg-white/5 px-3 py-2.5 -mx-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-blue-400/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="size-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{lead.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{(lead as any).vehicles?.title ?? "General"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      lead.status === "new" ? "bg-amber-400/20 text-amber-300" :
                      lead.status === "contacted" ? "bg-blue-400/20 text-blue-300" :
                      "bg-emerald-400/20 text-emerald-300"
                    }`}>
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {new Date(lead.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageSquare className="size-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No leads yet.</p>
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Active Listings</h2>
            <Link href="/admin/inventory" className="text-xs text-primary hover:underline font-semibold">Manage →</Link>
          </div>
          {recentVehicles && recentVehicles.length > 0 ? (
            <div className="space-y-3">
              {recentVehicles.map((v: any) => (
                <Link
                  key={v.id}
                  href={`/admin/inventory/${v.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl hover:bg-white/5 px-3 py-2.5 -mx-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Car className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{v.title}</p>
                      <p className="text-xs text-slate-500">{v.year} · ${v.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs text-slate-500">
                    <Eye className="size-3" />
                    {v.views_count ?? 0}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Car className="size-7 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-white">No active listings</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add your first vehicle to start selling.</p>
              <Link
                href="/admin/inventory/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-9 text-xs font-bold text-black hover:scale-105 transition-transform"
              >
                <Plus className="size-3.5" /> Add Listing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Market Insights banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-black/40 via-primary/5 to-black/40 p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-5 pointer-events-none">
          <TrendingUp className="size-40" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Full Inventory Management</h3>
            <p className="text-sm text-slate-400 mt-1">Add vehicles, track views, manage leads and set prices all in one place.</p>
          </div>
          <Link
            href="/admin"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 h-10 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Admin Panel <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
