import type { ReactNode } from "react";
import { requireAdmin, getUserAdminRole } from "@/lib/security/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const adminRole = await getUserAdminRole(user);

  return <DashboardShell mode="admin" adminRole={adminRole} userEmail={user.email}>{children}</DashboardShell>;
}
