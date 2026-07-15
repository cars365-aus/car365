"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Car, Phone, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ThreadPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      const { data: leadData } = await supabase
        .from("leads")
        .select(`
          id, name, email, phone, status, message, type, created_at, updated_at,
          vehicles:vehicle_id (id, title, slug, make, model, year, price, transmission, fuel_type, mileage_km)
        `)
        .eq("id", params.id)
        .eq("email", user.email ?? "")
        .single();

      if (!leadData) {
        router.push("/account/messages");
        return;
      }

      setLead(leadData);
      setLoading(false);
    }

    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    new:       { label: "Awaiting Response", color: "text-amber-300",   bg: "bg-amber-400/20",   icon: Clock },
    contacted: { label: "In Progress",       color: "text-blue-300",    bg: "bg-blue-400/20",    icon: MessageSquare },
    closed:    { label: "Resolved",          color: "text-emerald-300", bg: "bg-emerald-400/20", icon: CheckCircle2 },
    lost:      { label: "Closed",            color: "text-slate-400",   bg: "bg-white/10",       icon: CheckCircle2 },
  };
  const cfg = statusConfig[lead.status] ?? statusConfig.new;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10">
        <Link href="/account/messages" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">
            {lead.vehicles?.title ?? "General Enquiry"}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <Clock className="size-3" />
            Submitted {new Date(lead.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl border border-white/10 ${cfg.bg} px-5 py-4 flex items-center gap-3`}>
        <StatusIcon className={`size-5 ${cfg.color} shrink-0`} />
        <div>
          <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {lead.status === "new"
              ? "Our team will be in touch within 2 business hours."
              : lead.status === "contacted"
                ? "Our team has been in contact with you."
                : "This enquiry has been resolved. Feel free to start a new one."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Your Message */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Enquiry</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-16 shrink-0">Name</span>
              <span className="text-white font-medium">{lead.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-16 shrink-0">Email</span>
              <span className="text-white font-medium">{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 w-16 shrink-0">Phone</span>
                <a href={`tel:${lead.phone}`} className="text-primary font-medium hover:underline">{lead.phone}</a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-16 shrink-0">Type</span>
              <span className="text-white font-medium capitalize">{lead.type ?? "enquiry"}</span>
            </div>
          </div>

          {lead.message && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;{lead.message}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        {lead.vehicles ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Vehicle</h2>
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Car className="size-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white leading-snug">{lead.vehicles.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {lead.vehicles.year} · {lead.vehicles.mileage_km?.toLocaleString()} km
                </p>
                <p className="text-xl font-black text-primary mt-2">
                  ${lead.vehicles.price?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Fuel", value: lead.vehicles.fuel_type },
                { label: "Trans.", value: lead.vehicles.transmission },
              ].map((spec) => spec.value ? (
                <div key={spec.label} className="rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-slate-500">{spec.label}</p>
                  <p className="text-white font-semibold mt-0.5 capitalize">{spec.value}</p>
                </div>
              ) : null)}
            </div>

            <Link
              href={`/used-cars/${lead.vehicles.make?.toLowerCase()}/${lead.vehicles.model?.toLowerCase()}/${lead.vehicles.slug}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary h-10 px-4 text-sm font-bold text-black hover:scale-[1.02] transition-transform"
            >
              View Vehicle Listing
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 flex flex-col items-center justify-center text-center">
            <MessageSquare className="size-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">General enquiry — no specific vehicle.</p>
          </div>
        )}
      </div>

      {/* Contact Again CTA */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Need to follow up?</p>
          <p className="text-xs text-slate-400 mt-0.5">Contact our team directly and we&apos;ll help you out.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 h-9 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
