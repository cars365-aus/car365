import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createFeaturedPlacement, endFeaturedPlacement } from "./actions";
import { Star } from "lucide-react";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Featured Placements" };

export default async function AdminFeaturedPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [{ data: placements }, { data: organizations }] = await Promise.all([
    supabase
      .from("featured_placements")
      .select(`
        id, city, starts_at, ends_at, created_at,
        organizations(name),
        vehicles(title, slug)
      `)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("organizations")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold">Featured Placements</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Promote vehicles on the homepage and in search for Growth and Pro vendors.
        </p>
      </div>

      <form action={createFeaturedPlacement} className="rounded-2xl border border-border bg-card p-6 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">New placement</h2>
        <div>
          <label className="text-sm font-medium">Organization</label>
          <select name="organizationId" required className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm">
            <option value="">Select vendor</option>
            {organizations?.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Vehicle ID (optional)</label>
          <input name="vehicleId" placeholder="UUID of specific vehicle" className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">City (optional, blank = all cities)</label>
          <input name="city" placeholder="Sydney" className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Starts at</label>
          <input name="startsAt" type="datetime-local" required className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Ends at</label>
          <input name="endsAt" type="datetime-local" required className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="md:col-span-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Create placement
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Vendor</th>
              <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Period</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {placements?.map((p) => {
              type Org = { name: string };
              type Veh = { title: string; slug: string } | null;
              const org = p.organizations as unknown as Org;
              const veh = p.vehicles as unknown as Veh;
              const active = new Date(p.ends_at) > new Date();
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{org?.name}</td>
                  <td className="px-4 py-3">{veh?.title ?? "All vehicles"}</td>
                  <td className="px-4 py-3">{p.city ?? "All"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.starts_at).toLocaleDateString()} – {new Date(p.ends_at).toLocaleDateString()}
                    {!active && <span className="ml-2 text-red-600">Ended</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {active && (
                      <ActionButton
                        action={endFeaturedPlacement.bind(null, p.id)}
                        label="End now"
                        loadingLabel="Ending..."
                        variant="link"
                        className="text-xs font-semibold text-red-600 hover:underline h-auto p-0"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
