import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBranchesTable } from "./branches-table";

export const metadata = {
  title: "Branches Overview",
};

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Fetch branches
  const { data: branches, error } = await supabase
    .from("branches")
    .select(
      `
      id, name, city, state, phone, status, created_at,
      organizations(id, name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch branches: ${error.message}`);
  }

  const tableData = (branches ?? []).map((branch) => ({
    id: branch.id,
    name: branch.name,
    city: branch.city ?? "",
    state: branch.state ?? "",
    phone: branch.phone ?? "",
    status: branch.status ?? "unknown",
    vendor_name: (branch.organizations as unknown as { name: string })?.name ?? "Unknown",
    created_at: branch.created_at,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Branches</h1>
        <p className="mt-2 text-muted-foreground">
          Review branch status, service cities, contact numbers, and pickup locations.
        </p>
      </section>

      <AdminBranchesTable data={tableData} />
    </div>
  );
}
