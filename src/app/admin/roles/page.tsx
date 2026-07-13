import { Shield, ShieldAlert } from "lucide-react";
import { requireAdminRole } from "@/lib/security/auth";
import { getAdminRoles } from "./actions";
import { RolesManager } from "./roles-manager";

export const metadata = {
  title: "Role Management",
};

export default async function AdminRolesPage() {
  await requireAdminRole(["owner", "admin", "super_admin"]);

  const roles = await getAdminRoles();
  const activeCount = roles.filter((r) => r.active).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="flex flex-col gap-3 border-b border-border/50 pb-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              Role Management
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl font-medium">
              Manage who has access to the admin portal and what they can do. Only super admins can assign or revoke roles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-foreground">{activeCount}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Admins</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role permissions reference */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "Moderator", desc: "Manage inventory, upload photos, close fraud flags", icon: "🛡️", color: "border-blue-200 bg-blue-50/50" },
          { role: "Support", desc: "View leads, moderate reviews, reply to enquiries", icon: "🎧", color: "border-purple-200 bg-purple-50/50" },
          { role: "Finance", desc: "View billing, subscriptions, revenue", icon: "💰", color: "border-emerald-200 bg-emerald-50/50" },
          { role: "Admin / Owner", desc: "Full access including role management", icon: "👑", color: "border-amber-200 bg-amber-50/50" },
        ].map((item) => (
          <div key={item.role} className={`rounded-2xl border p-4 ${item.color}`}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-bold text-foreground text-sm">{item.role}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Important security notes</p>
          <ul className="mt-1.5 space-y-1 text-amber-800 list-disc list-inside">
            <li>Users must already have an account on the platform before you can grant access</li>
            <li>MFA (multi-factor authentication) is strongly recommended for all admin roles</li>
            <li>Revoked access can be restored — users are never deleted from this table</li>
            <li>All role changes are logged in the Audit trail</li>
          </ul>
        </div>
      </div>

      {/* Role manager UI */}
      <RolesManager roles={roles} />
    </div>
  );
}
