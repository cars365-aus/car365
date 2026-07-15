import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Search, Heart, Tag, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface BuyerOverviewProps {
  userId: string;
  email: string;
}

export async function BuyerOverview({ userId, email }: BuyerOverviewProps) {
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

  // Fetch real enquiry count from leads table
  const { count: enquiryCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email);

  // Fetch most recent 3 enquiries for the activity feed
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("id, created_at, status, vehicle_id, vehicles:vehicle_id(title, make, model, slug)")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch featured vehicles for browsing suggestions
  const { data: featuredVehicles } = await supabase
    .from("vehicles")
    .select("id, title, make, model, slug, price, year, mileage_km, exterior_color, images:vehicle_images(url)")
    .eq("status", "active")
    .eq("is_featured", true)
    .limit(3);

  const stats = [
    { label: "Enquiries Sent", value: String(enquiryCount ?? 0), icon: Tag, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Saved Cars", value: "See list →", icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10", href: "/account/saved" },
    { label: "Browse Inventory", value: "New arrivals", icon: Search, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/used-cars" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-white">Welcome back!</h1>
        <p className="mt-2 text-slate-400">Here&apos;s an overview of your car buying journey.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md hover:border-white/20 transition-colors">
            {stat.href ? (
              <Link href={stat.href} className="block">
                <div className={`mb-3 inline-flex size-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="size-5" />
                </div>
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <p className="mt-1 text-lg font-black text-white">{stat.value}</p>
              </Link>
            ) : (
              <>
                <div className={`mb-3 inline-flex size-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="size-5" />
                </div>
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Recent Enquiries */}
      {recentLeads && recentLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Enquiries</h2>
            <Link href="/account/offers" className="text-sm text-primary hover:underline font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-5 py-4 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {(lead as any).vehicles?.title ?? "General Enquiry"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {new Date(lead.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`ml-4 shrink-0 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  lead.status === "new" ? "bg-amber-400/20 text-amber-300" :
                  lead.status === "contacted" ? "bg-blue-400/20 text-blue-300" :
                  lead.status === "closed" ? "bg-emerald-400/20 text-emerald-300" :
                  "bg-white/10 text-slate-400"
                }`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Cars / Continue Browsing */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Browse Inventory</h2>
          <Link href="/used-cars" className="text-sm text-primary hover:underline font-semibold">See all</Link>
        </div>
        {featuredVehicles && featuredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredVehicles.map((v: any) => (
              <Link
                key={v.id}
                href={`/used-cars/${v.make?.toLowerCase()}/${v.model?.toLowerCase()}/${v.slug}`}
                className="group rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-primary/40 transition-colors"
              >
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-600">
                  <Search className="size-8" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{v.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{v.year} · {v.mileage_km?.toLocaleString()} km</p>
                  <p className="text-sm font-black text-primary mt-2">${v.price?.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-8 flex flex-col items-center justify-center text-center">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search className="size-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-white">Find your next car</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-xs">Browse our full inventory of quality, pre-inspected used cars.</p>
            <Link
              href="/used-cars"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,204,0,0.2)]"
            >
              Browse Inventory <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
