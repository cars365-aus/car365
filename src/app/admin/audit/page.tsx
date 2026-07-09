import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAuditTable } from "./audit-table";

export const metadata = {
  title: "Audit Log",
};

interface AdminAuditPageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from("audit_logs")
    .select(
      `
      id, action, resource_type, resource_id, metadata, created_at,
      actor_user_id,
      profiles(full_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  // Apply optional filters from search params
  if (params.type) {
    query = query.eq("resource_type", params.type);
  }
  if (params.id) {
    query = query.eq("resource_id", params.id);
  }

  const { data: logs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  const tableData = (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action ?? "",
    resource_type: log.resource_type ?? "",
    resource_id: log.resource_id ?? "",
    actor_name: (log.profiles as unknown as { full_name: string })?.full_name ?? "System",
    created_at: log.created_at,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="mt-2 text-muted-foreground">
          Append-only records for approval, billing, moderation, role, and listing state changes.
        </p>
      </section>

      <AdminAuditTable data={tableData} />
    </div>
  );
}
