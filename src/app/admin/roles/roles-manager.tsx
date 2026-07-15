"use client";

import { useActionState, useTransition } from "react";
import { UserPlus, CheckCircle, AlertCircle, Shield, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { assignAdminRole, revokeAdminRole, restoreAdminRole } from "./actions";
import type { AdminRoleEntry, RoleActionState } from "./actions";

const ROLE_OPTIONS = [
  { value: "sales", label: "Sales", description: "Work leads (view, update, assign to self) & quick-change vehicle status", color: "bg-blue-100 text-blue-700 border-blue-200" },

  { value: "manager", label: "Manager", description: "Inventory, leads, content & reports (no users/settings)", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "admin", label: "Admin", description: "Full admin access except owner-only actions", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "owner", label: "Owner", description: "Full control including users, settings & hard delete", color: "bg-red-100 text-red-700 border-red-200" },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: "bg-red-100 text-red-700 border-red-200",
  admin: "bg-amber-100 text-amber-700 border-amber-200",
  manager: "bg-emerald-100 text-emerald-700 border-emerald-200",
  sales: "bg-blue-100 text-blue-700 border-blue-200",
  content: "bg-purple-100 text-purple-700 border-purple-200",
};

const initialAssignState: RoleActionState = { status: "idle", message: "" };

function AssignRoleForm() {
  const [state, action, isPending] = useActionState(assignAdminRole, initialAssignState);

  return (
    <Card variant="elevated" className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-orange-50/40 to-amber-50/20">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Grant Admin Access
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {state.status !== "idle" && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.status === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>{state.message}</span>
          </div>
        )}

        <form action={action} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="assign-email">User email address <span className="text-red-500">*</span></Label>
            <Input
              id="assign-email"
              name="email"
              type="email"
              required
              placeholder="staff@example.com"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">The user must already have an account on the platform.</p>
          </div>

          <div className="grid gap-3">
            <Label>Role <span className="text-red-500">*</span></Label>
            <div className="grid gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/70 hover:bg-card hover:border-primary/30 cursor-pointer transition-all group"
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    defaultChecked={opt.value === "sales"}
                    className="accent-primary"
                    required
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${opt.color}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/70">
            <input
              id="mfaRequired"
              type="checkbox"
              name="mfaRequired"
              value="true"
              defaultChecked
              className="accent-primary h-4 w-4"
            />
            <div>
              <Label htmlFor="mfaRequired" className="cursor-pointer font-semibold">Require MFA</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Enforce multi-factor authentication for this admin</p>
            </div>
          </div>

          <Button type="submit" size="cta" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Granting access…
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Grant Admin Access
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RoleRow({ entry }: { entry: AdminRoleEntry }) {
  const [isPending, startTransition] = useTransition();
  const badgeColor = ROLE_BADGE_COLORS[entry.role] ?? "bg-muted text-muted-foreground border-border";

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeAdminRole(entry.userId);
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      await restoreAdminRole(entry.userId);
    });
  };

  return (
    <div
      className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-200 ${
        entry.active
          ? "bg-card/70 border-border/60 hover:border-primary/20 hover:bg-card hover:shadow-sm"
          : "bg-muted/50 border-border opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          entry.active ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm" : "bg-slate-200 text-muted-foreground"
        }`}>
          {(entry.fullName || entry.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-foreground truncate">
            {entry.fullName ?? entry.email}
          </div>
          {entry.fullName && (
            <div className="text-xs text-muted-foreground truncate">{entry.email}</div>
          )}
          <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
            Granted {new Date(entry.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-13 sm:ml-0 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
          {entry.role}
        </span>
        {entry.mfaRequired && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-muted text-slate-600 border-border flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> MFA
          </span>
        )}
        {!entry.active && (
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
            Revoked
          </Badge>
        )}
        {entry.active ? (
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
            Revoke
          </button>
        ) : (
          <button
            onClick={handleRestore}
            disabled={isPending}
            className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-emerald-200 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Restore
          </button>
        )}
      </div>
    </div>
  );
}

export function RolesManager({ roles }: { roles: AdminRoleEntry[] }) {
  const activeRoles = roles.filter((r) => r.active);
  const revokedRoles = roles.filter((r) => !r.active);

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      {/* Left: Assign form */}
      <div>
        <AssignRoleForm />
      </div>

      {/* Right: Current roles list */}
      <div className="space-y-6">
        {/* Active admins */}
        <Card variant="elevated">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Active Admins
              </span>
              <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {activeRoles.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {activeRoles.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No active admins. Grant access using the form.
              </div>
            ) : (
              <div className="space-y-2">
                {activeRoles.map((entry) => (
                  <RoleRow key={entry.userId} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revoked admins */}
        {revokedRoles.length > 0 && (
          <Card variant="elevated">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-lg text-muted-foreground">
                  <ShieldOff className="h-5 w-5" />
                  Revoked Access
                </span>
                <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {revokedRoles.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {revokedRoles.map((entry) => (
                  <RoleRow key={entry.userId} entry={entry} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
