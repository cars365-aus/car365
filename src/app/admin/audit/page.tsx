import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAuditTable } from "./audit-table";

export const metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

interface AdminAuditPageProps {
  searchParams: Promise<{ type?: string; id?: string }>;
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("activity_logs")
    .select("id, action, entity_type, entity_id, created_at, user_id, profiles:user_id ( full_name )")
    .order("created_at", { ascending: false })
    .limit(200);
  if (params.type) query = query.eq("entity_type", params.type);
  if (params.id) query = query.eq("entity_id", params.id);

  const { data: logs } = await query;

  const tableData = (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action ?? "",
    resource_type: log.entity_type ?? "",
    resource_id: log.entity_id ?? "",
    actor_name: (log.profiles as unknown as { full_name: string })?.full_name ?? "System",
    created_at: log.created_at,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Append-only record of staff actions across inventory, leads, and content.</p>
      </header>
      <AdminAuditTable data={tableData} />
    </div>
  );
}
