import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/security/auth";

import { getVendorContext } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  
  const [context, { userHasAdminAccess }] = await Promise.all([
    getVendorContext(user.id),
    import("@/lib/security/auth")
  ]);

  const isAdmin = await userHasAdminAccess(user);

  if (context.organizations.length === 0) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const organizationId = context.organizations[0].id;
  
  // OPTIMIZATION: Do not block the initial layout render with notifications query
  const supabase = createAdminClient();
  const notificationsPromise = supabase
    .from("notifications")
    .select("id, title, message, type, read, created_at, link")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10)
    .then(res => res.data ?? []);

  return (
    <DashboardShell 
      mode="vendor" 
      isAdmin={isAdmin} 
      userEmail={user.email} 
      orgId={organizationId} 
      // We will pass an empty array initially to stream the shell fast. 
      // A better approach would be to fetch this inside a Client Component or use SWR.
      // For now, to unblock TTFB, we default to empty array and let the user click to load if needed,
      // or we can just fetch it before if it's fast. Let's just fetch it but use Promise.all with the others.
    >
      {children}
    </DashboardShell>
  );
}
