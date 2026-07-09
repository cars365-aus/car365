import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { MessageCircle, Search, ChevronRight, User, Calendar, Clock, CheckCircle, Store, ArrowRight } from "lucide-react";
// import removed

export const metadata = {
  title: "Customer Dashboard | Hire Car",
};

export default async function CustomerDashboardPage() {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  const email = profile?.email;
  const firstName = profile?.full_name?.split(" ")[0] || "Customer";

  // Get active enquiries count
  const { count: enquiriesCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", email)
    .in("status", ["new", "contacted"]);

  // Get recent enquiries
  const { data: recentEnquiries } = await supabase
    .from("leads")
    .select(`
      id, status, created_at, start_date, end_date,
      vehicles(title, price_per_day_aud),
      organizations(name)
    `)
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-slate-50/50 min-h-full">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-2 text-slate-500 font-medium">Here is an overview of your rental activity.</p>
      </div>

      <div className="mb-8 rounded-[2rem] border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#ea580c]">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Own a rental business?</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Upgrade to a vendor account to list your fleet, receive leads, and manage your business on Hire Car.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/upgrade"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            List your fleet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Profile Card */}
        <div className="lg:col-span-1 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <User className="w-32 h-32 text-orange-500" />
          </div>
          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ea580c] to-amber-500 text-white font-black text-2xl mb-6 shadow-lg shadow-orange-500/30">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{profile?.full_name}</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">{profile?.email}</p>
            
            <Link href="/customer/settings" className="inline-flex items-center gap-2 text-sm font-bold text-[#ea580c] hover:text-[#c2410c] transition-colors">
              Edit Profile <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-8 relative overflow-hidden flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-[#ea580c]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-900 uppercase tracking-wider">Active Enquiries</p>
                <p className="text-4xl font-black text-[#ea580c]">{enquiriesCount ?? 0}</p>
              </div>
            </div>
            <Link href="/customer/enquiries" className="mt-2 text-sm font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 w-fit bg-orange-100/50 px-4 py-2 rounded-lg transition-colors">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 relative overflow-hidden flex flex-col justify-center shadow-sm">
             <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Find a Car</p>
                <p className="text-xl font-black text-slate-900 leading-tight">Ready for your<br/>next trip?</p>
              </div>
            </div>
            <Link href="/search" className="mt-2 text-sm font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 w-fit bg-slate-100 px-4 py-2 rounded-lg transition-colors">
              Browse vehicles <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900">Recent Enquiries</h2>
          <Link href="/customer/enquiries" className="text-sm font-bold text-slate-500 hover:text-[#ea580c] transition-colors flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {(!recentEnquiries || recentEnquiries.length === 0) ? (
          <div className="text-center py-20 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white">
            <Search className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg text-slate-900 font-bold">No recent enquiries found</p>
            <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Start browsing our premium fleet and find the perfect car for your next adventure.</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Search className="h-4 w-4" />
              Browse Vehicles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEnquiries.map((lead) => {
              type LeadVehicle = { title: string, price_per_day_aud: number };
              type LeadOrg = { name: string };
              const v = lead.vehicles as unknown as LeadVehicle;
              const o = lead.organizations as unknown as LeadOrg;
              
              const isNew = lead.status === "new";
              const isInProgress = lead.status === "contacted";
              const isClosed = lead.status === "lost";
              const isConverted = lead.status === "converted";

              return (
                <Link
                  key={lead.id}
                  href={`/messages/${lead.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 hover:border-orange-300 hover:shadow-md transition-all group gap-4"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black text-lg text-slate-900 group-hover:text-[#ea580c] transition-colors">{v?.title}</p>
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
                        isNew ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        isInProgress ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        isConverted ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {isNew && <Clock className="h-3 w-3" />}
                        {isInProgress && <MessageCircle className="h-3 w-3" />}
                        {(isClosed || isConverted) && <CheckCircle className="h-3 w-3" />}
                        {lead.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <span>{o?.name}</span>
                      {lead.start_date && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1 text-slate-600">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(lead.start_date).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                     <p className="text-lg font-black text-slate-900">${v?.price_per_day_aud}<span className="text-xs text-slate-400 font-semibold">/day</span></p>
                    <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-[#ea580c] group-hover:border-[#ea580c] group-hover:text-white transition-colors">
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
