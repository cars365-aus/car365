"use server";

import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type AdminRoleEntry = {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
  mfaRequired: boolean;
  createdAt: string;
};

export type RoleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const VALID_ROLES = ["owner", "admin", "moderator", "support"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function isValidRole(role: string): role is ValidRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

/** List all admin role holders with their profile and auth email */
export async function getAdminRoles(): Promise<AdminRoleEntry[]> {
  await requireAdminRole(["owner", "admin", "super_admin"]);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_roles")
    .select("user_id, role, active, mfa_required, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch admin roles: ${error.message}`);

  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = row.profiles as unknown as { email: string | null; full_name: string | null } | null;
    return {
      userId: row.user_id,
      email: profile?.email ?? "—",
      fullName: profile?.full_name ?? null,
      role: row.role,
      active: row.active,
      mfaRequired: row.mfa_required,
      createdAt: row.created_at,
    };
  });
}

/** Search for a user by email so admin can assign a role */
export async function searchUserByEmail(
  email: string,
): Promise<{ id: string; email: string; fullName: string | null } | null> {
  await requireAdminRole(["owner", "admin", "super_admin"]);

  const supabase = createAdminClient();

  // Search via profiles table (which has email column)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email.trim())
    .maybeSingle();

  if (profileData) {
    return {
      id: profileData.id,
      email: profileData.email ?? email,
      fullName: profileData.full_name,
    };
  }

  // Fallback: search auth.users via admin API
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const match = (listData?.users ?? []).find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase(),
  );

  if (match) {
    return {
      id: match.id,
      email: match.email!,
      fullName: match.user_metadata?.full_name ?? null,
    };
  }

  return null;
}

/** Assign or update an admin role for a user */
export async function assignAdminRole(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  await requireAdminRole(["owner", "admin", "super_admin"]);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const mfaRequired = formData.get("mfaRequired") === "true";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!isValidRole(role)) {
    return { status: "error", message: `Invalid role "${role}". Allowed: ${VALID_ROLES.join(", ")}.` };
  }

  const supabase = createAdminClient();

  // Look up the user
  const user = await searchUserByEmail(email);
  if (!user) {
    return {
      status: "error",
      message: `No user found with email "${email}". They must have an account on the platform first.`,
    };
  }

  // Upsert admin role
  const { error } = await supabase.from("admin_roles").upsert(
    {
      user_id: user.id,
      role,
      active: true,
      mfa_required: mfaRequired,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { status: "error", message: `Failed to assign role: ${error.message}` };
  }

  // Audit log
  const actingUser = await requireAdminRole(["owner", "admin", "super_admin"]);
  await supabase.from("audit_logs").insert({
    actor_user_id: actingUser.id,
    action: "admin_role_assigned",
    resource_type: "admin_role",
    resource_id: user.id,
    metadata: { email, role, mfaRequired },
  });

  revalidatePath("/admin/roles");

  return {
    status: "success",
    message: `Role "${role}" assigned to ${user.email}${user.fullName ? ` (${user.fullName})` : ""} successfully.`,
  };
}

/** Revoke (deactivate) an admin role */
export async function revokeAdminRole(userId: string): Promise<RoleActionState> {
  const actingUser = await requireAdminRole(["owner", "admin", "super_admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_roles")
    .update({ active: false })
    .eq("user_id", userId);

  if (error) {
    return { status: "error", message: `Failed to revoke role: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actingUser.id,
    action: "admin_role_revoked",
    resource_type: "admin_role",
    resource_id: userId,
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Admin access revoked." };
}

/** Restore (reactivate) a previously revoked admin role */
export async function restoreAdminRole(userId: string): Promise<RoleActionState> {
  const actingUser = await requireAdminRole(["owner", "admin", "super_admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_roles")
    .update({ active: true })
    .eq("user_id", userId);

  if (error) {
    return { status: "error", message: `Failed to restore role: ${error.message}` };
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actingUser.id,
    action: "admin_role_restored",
    resource_type: "admin_role",
    resource_id: userId,
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Admin access restored." };
}
