import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatInterface } from "@/components/chat-interface";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Calendar } from "lucide-react";

export default async function VendorChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = createAdminClient();

  // Fetch lead and verify vendor ownership
  const { data: lead } = await supabase
    .from("leads")
    .select(`
      *,
      vehicles(title, price_per_day_aud)
    `)
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  try {
    await ensureUserCanManageOrganization(user.id, lead.vendor_id);
  } catch {
    notFound();
  }

  // Fetch existing messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const vehicle = lead.vehicles as unknown as { title: string; price_per_day_aud: number } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/vendor/leads"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lead: {vehicle?.title}
          </h1>
        </div>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide border-emerald-200 bg-emerald-50 text-emerald-600">
          {lead.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Details Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="font-medium">{lead.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <a href={`mailto:${lead.customer_email}`} className="font-medium text-emerald-600 hover:underline">
                  {lead.customer_email}
                </a>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <a href={`tel:${lead.customer_phone}`} className="font-medium text-emerald-600 hover:underline flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.customer_phone}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Rental Request</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Pickup Location</p>
                  <p className="font-medium">{lead.pickup_city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500">Dates</p>
                  <p className="font-medium">
                    {new Date(lead.start_date).toLocaleDateString()} - {new Date(lead.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <ChatInterface 
            leadId={lead.id} 
            currentUserId={user.id} 
            initialMessages={messages || []} 
            otherPartyName={lead.customer_name}
          />
        </div>
      </div>
    </div>
  );
}
