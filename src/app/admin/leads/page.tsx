import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLeadsTable } from "./leads-table";
import { WhatsAppLeadsTable } from "./whatsapp-leads-table";

export const metadata = {
  title: "Leads Overview",
};

export default async function AdminLeadsPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Fetch form/enquiry leads for the table
  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `
      id, customer_name, customer_email, customer_phone, message, status, created_at,
      organizations(id, name),
      vehicles(id, title)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  // Fetch WhatsApp leads
  const { data: waLeads, error: waError } = await supabase
    .from("whatsapp_leads")
    .select("id, sender_phone, sender_name, message_body, message_type, reply_variant, notified_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (waError) {
    // Non-fatal: log but don't crash the page
    console.error("Failed to fetch WhatsApp leads:", waError.message);
  }

  const tableData = (leads ?? []).map((lead) => ({
    id: lead.id,
    customer_name: lead.customer_name ?? "Anonymous",
    customer_email: lead.customer_email ?? "",
    lead_type: "enquiry",
    status: lead.status ?? "new",
    vendor_name: (lead.organizations as unknown as { name: string })?.name ?? "Unknown",
    vehicle_title: (lead.vehicles as unknown as { title: string })?.title ?? "N/A",
    created_at: lead.created_at,
  }));

  const waTableData = (waLeads ?? []).map((lead) => ({
    id: lead.id,
    sender_name: lead.sender_name ?? "Unknown",
    sender_phone: lead.sender_phone,
    message_preview: lead.message_body
      ? lead.message_body.length > 80
        ? lead.message_body.slice(0, 80) + "…"
        : lead.message_body
      : "",
    reply_variant: lead.reply_variant as "in_hours" | "away",
    notified_status: lead.notified_status ?? "pending",
    created_at: lead.created_at,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
        <p className="mt-2 text-muted-foreground">
          Review lead delivery health without exposing more customer PII than necessary.
        </p>
      </section>

      <AdminLeadsTable data={tableData} />

      {/* WhatsApp Leads Section */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-emerald-600"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <h2 className="text-lg font-semibold text-foreground">WhatsApp Leads</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Inbound messages received via WhatsApp Business.
        </p>
        <WhatsAppLeadsTable data={waTableData} />
      </section>
    </div>
  );
}
