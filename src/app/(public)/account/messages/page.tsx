import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Car, Clock, Phone, Mail, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Messages | Cars365",
};

export default async function AccountMessagesPage() {
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

  // Fetch all enquiries with full vehicle details as the "messages" history
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, status, created_at, updated_at, message, name, phone, type,
      vehicles:vehicle_id (id, title, slug, make, model, year, price)
    `)
    .eq("email", user.email ?? "")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm text-white">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Messages</h1>
          <p className="text-sm text-slate-400 mt-1">Your enquiry history with our team.</p>
        </div>
      </div>

      {!leads || leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-white/10 bg-black/20">
          <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="size-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm text-sm">
            When you enquire about a vehicle our team will be in touch. It will all appear here.
          </p>
          <Link
            href="/used-cars"
            className="bg-primary text-black font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:scale-[1.02] transition-all text-sm"
          >
            Find a Vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead: any) => {
            const isNew = lead.status === "new";
            const lastUpdated = new Date(lead.updated_at || lead.created_at);
            return (
              <div
                key={lead.id}
                className={`group relative rounded-2xl border bg-black/40 backdrop-blur-md p-5 transition-all duration-300 ${
                  isNew ? "border-primary/40 shadow-[0_0_15px_rgba(255,204,0,0.05)]" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Icon */}
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isNew ? "bg-primary/20" : "bg-white/5"
                    }`}>
                      {lead.vehicles ? (
                        <Car className={`size-5 ${isNew ? "text-primary" : "text-slate-400"}`} />
                      ) : (
                        <MessageSquare className={`size-5 ${isNew ? "text-primary" : "text-slate-400"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-white">
                          {lead.vehicles?.title ?? "General Enquiry"}
                        </h3>
                        {isNew && (
                          <span className="inline-block rounded-full bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                            New Reply
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="size-3" />
                        {lastUpdated.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {lead.message && (
                        <p className="mt-2 text-sm text-slate-400 line-clamp-2 italic">
                          &ldquo;{lead.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status + action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      lead.status === "new"       ? "bg-amber-400/20 text-amber-300" :
                      lead.status === "contacted" ? "bg-blue-400/20 text-blue-300" :
                      "bg-emerald-400/20 text-emerald-300"
                    }`}>
                      {lead.status === "new" ? "Pending" : lead.status === "contacted" ? "In Progress" : "Resolved"}
                    </span>
                    {lead.vehicles?.slug && (
                      <Link
                        href={`/used-cars/${lead.vehicles.make?.toLowerCase()}/${lead.vehicles.model?.toLowerCase()}/${lead.vehicles.slug}`}
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        View Car <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact CTA */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Phone className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Need urgent help?</p>
            <p className="text-xs text-slate-400">Our team responds within 2 hours on business days.</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 h-10 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          Contact Us <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
