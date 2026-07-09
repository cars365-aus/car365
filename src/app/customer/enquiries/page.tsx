import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { MessageCircle, ChevronRight, Search } from "lucide-react";

export const metadata = {
  title: "My Enquiries | Hire Car",
};

export default async function CustomerEnquiriesPage() {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!profile?.email) {
    return (
      <div className="p-6 sm:p-8">
        <p>Please complete your profile to view messages.</p>
      </div>
    );
  }

  // Fetch leads for this customer email
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, created_at, status, 
      vehicles(title, price_per_day_aud),
      organizations(name)
    `)
    .eq("customer_email", profile.email)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 sm:p-8 flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Enquiries</h1>
        <p className="mt-1 text-slate-500">Track and respond to your rental requests.</p>
      </div>
      
      {(!leads || leads.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 rounded-2xl border-2 border-dashed border-slate-200">
          <MessageCircle className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No enquiries yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mb-6">
            Browse cars and click &quot;I am interested&quot; to start a chat with a vendor.
          </p>
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <Search className="h-4 w-4" />
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leads.map((lead) => {
            type LeadVehicle = { title: string; price_per_day_aud: number };
            type LeadOrg = { name: string };
            const vehicle = lead.vehicles as unknown as LeadVehicle;
            const org = lead.organizations as unknown as LeadOrg;
            
            return (
              <Link key={lead.id} href={`/messages/${lead.id}`}>
                <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      lead.status === "new" ? "bg-blue-100 text-blue-700" :
                      lead.status === "contacted" ? "bg-amber-100 text-amber-700" :
                      lead.status === "lost" ? "bg-slate-100 text-slate-600" :
                      lead.status === "converted" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {lead.status.replace("_", " ")}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{vehicle?.title}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">Vendor: {org?.name}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString("en-AU", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                    <span className="text-sm font-bold text-slate-900">${vehicle?.price_per_day_aud}/day</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
