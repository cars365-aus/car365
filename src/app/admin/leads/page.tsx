import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLeadsTable } from "./leads-table";
import { KanbanBoard } from "./kanban-board";
import { Tabs, TabsPanel, TabsList, TabsTab } from "@/components/ui/tabs";

export const metadata = {
  title: "Leads Pipeline",
};

export default async function AdminLeadsPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `
      id, type, name, email, phone, message, status, created_at,
      vehicles(id, year, variant, makes:make_id(name), models:model_id(name))
    `,
    )
    .neq("status", "spam")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  // Type safe data transformation
  const tableData = (leads ?? []).map((lead) => {
    const v = lead.vehicles as any;
    const vehicleTitle = v ? `${v.year || ""} ${v.makes?.name || ""} ${v.models?.name || ""} ${v.variant || ""}`.trim() : "N/A";
    return {
      id: lead.id,
      name: lead.name ?? "Anonymous",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      type: lead.type,
      status: lead.status ?? "new",
      vehicle_title: vehicleTitle,
      created_at: lead.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Leads Pipeline</h1>
        <p className="mt-2 text-muted-foreground">
          Manage inbound enquiries, finance applications, and sell/trade-in requests.
        </p>
      </section>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTab value="kanban">Kanban Board</TabsTab>
          <TabsTab value="list">List View</TabsTab>
        </TabsList>
        <TabsPanel value="kanban" className="mt-0">
          <KanbanBoard initialLeads={tableData} />
        </TabsPanel>
        <TabsPanel value="list" className="mt-0">
          <AdminLeadsTable data={tableData} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
