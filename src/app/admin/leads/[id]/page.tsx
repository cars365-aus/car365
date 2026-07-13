import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Phone, Mail, Globe, MapPin, Smartphone } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return { title: `Lead ${resolved.id.slice(0, 8)}` };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolved = await params;
  const supabase = createAdminClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      `
      *,
      vehicles(id, year, variant, price, makes:make_id(name), models:model_id(name)),
      lead_events(id, event, data, created_at)
    `,
    )
    .eq("id", resolved.id)
    .single();

  if (error || !lead) {
    notFound();
  }

  const vehicle = lead.vehicles as any;
  const events = (lead.lead_events as any[]).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const payload = lead.payload as Record<string, any>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <Badge variant="outline" className="text-xs">
          {lead.type.replace(/_/g, " ").toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${lead.phone}`} className="hover:text-primary hover:underline">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">{lead.email}</a>
                </div>
              )}
            </div>
            
            {lead.message && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">Message</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}
            
            {Object.keys(payload).length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">Additional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(payload).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                      <dd className="text-sm text-muted-foreground">{String(value)}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {vehicle && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle of Interest</h3>
              <div className="flex justify-between items-center">
                <div>
                  <Link href={`/used-cars/${vehicle.id}`} className="font-medium text-primary hover:underline">
                    {vehicle.year} {vehicle.makes?.name} {vehicle.models?.name} {vehicle.variant}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1">Stock ID: {vehicle.id.split("-").pop()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">${vehicle.price?.toLocaleString()}</div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-medium text-foreground mb-4">Lead Status</h3>
            <form action="" className="space-y-4">
              <div className="text-sm font-semibold capitalize px-3 py-1.5 bg-muted rounded-md inline-block">
                Current: {lead.status}
              </div>
              <p className="text-xs text-muted-foreground">Status updates via Kanban board</p>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-medium text-foreground mb-4">Attribution</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              {lead.source_url && (
                <div className="flex gap-2 items-start">
                  <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="break-all">{lead.source_url}</span>
                </div>
              )}
              {lead.device && (
                <div className="flex gap-2 items-center">
                  <Smartphone className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{lead.device}</span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-medium text-foreground mb-4">Timeline</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {events.map((event, i) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-muted text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm text-foreground capitalize">
                        {event.event.replace(/_/g, " ")}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </time>
                    </div>
                    {event.data && Object.keys(event.data).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                        {JSON.stringify(event.data)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm text-foreground">Lead Created</div>
                    <time className="text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, h:mm a")}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
