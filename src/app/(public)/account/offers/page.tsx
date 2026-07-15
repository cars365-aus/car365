import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Car, Clock, MessageSquare, Phone, Mail } from "lucide-react";

export const metadata = {
  title: "My Enquiries | Cars365",
};

export default async function AccountOffersPage() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch enquiries (leads) submitted by this user's email
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, status, created_at, message, name, phone, type,
      vehicles:vehicle_id (id, title, slug, make, model, year, price)
    `)
    .eq("email", user.email ?? "")
    .order("created_at", { ascending: false });

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    new:        { label: "Pending",   bg: "bg-amber-400/20",   text: "text-amber-300" },
    contacted:  { label: "Contacted", bg: "bg-blue-400/20",    text: "text-blue-300" },
    closed:     { label: "Resolved",  bg: "bg-emerald-400/20", text: "text-emerald-300" },
    lost:       { label: "Closed",    bg: "bg-white/10",       text: "text-slate-400" },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm text-black">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My Enquiries</h1>
          <p className="text-sm text-slate-400 mt-1">Track the status of your car enquiries.</p>
        </div>
      </div>

      {!leads || leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-white/10 bg-black/20">
          <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Car className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No enquiries yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm text-sm">
            When you enquire about a vehicle, it will appear here so you can track the status.
          </p>
          <Link
            href="/used-cars"
            className="bg-primary text-black font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-md shadow-primary/20 text-sm"
          >
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead: any) => {
            const cfg = statusConfig[lead.status] ?? statusConfig.new;
            return (
              <div
                key={lead.id}
                className="group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-5"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <h3 className="font-bold text-base text-white truncate group-hover:text-primary transition-colors">
                      {lead.vehicles?.title ?? "General Enquiry"}
                    </h3>
                    {lead.vehicles && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.vehicles.year} · ${lead.vehicles.price?.toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {new Date(lead.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  {lead.message && (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-sm text-slate-400 italic leading-relaxed line-clamp-2">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    {lead.phone && (
                      <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>
                    )}
                    <span className="flex items-center gap-1 capitalize"><MessageSquare className="size-3" />{lead.type ?? "enquiry"}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                  <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  {lead.vehicles?.slug && (
                    <Link
                      href={`/used-cars/${lead.vehicles.make?.toLowerCase()}/${lead.vehicles.model?.toLowerCase()}/${lead.vehicles.slug}`}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      View Car →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
