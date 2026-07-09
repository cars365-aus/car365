import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBillingTable } from "./billing-table";

export const metadata = {
  title: "Billing Overview",
};

export default async function AdminBillingPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Fetch subscriptions
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id, plan_code, status, current_period_start, current_period_end, created_at,
      organizations(id, name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }

  const tableData = (subscriptions ?? []).map((sub) => ({
    id: sub.id,
    plan_code: sub.plan_code ?? "unknown",
    status: sub.status ?? "unknown",
    vendor_name: (sub.organizations as unknown as { name: string })?.name ?? "Unknown",
    period_start: sub.current_period_start ?? "",
    period_end: sub.current_period_end ?? "",
    created_at: sub.created_at,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor plan limits, subscription status, failed payment states, and webhook reconciliation.
        </p>
      </section>

      <AdminBillingTable data={tableData} />
    </div>
  );
}
