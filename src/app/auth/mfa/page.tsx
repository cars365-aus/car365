import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, userHasPlatformRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Shield } from "lucide-react";

export const metadata = { title: "Admin MFA Required" };

async function userHasAdminRoleRecord(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  return !!data;
}

export default async function MfaPage() {
  const user = await requireUser();
  const hasAdmin =
    userHasPlatformRole(user) || (await userHasAdminRoleRecord(user.id));

  if (!hasAdmin) {
    redirect("/customer/dashboard");
  }

  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Two-factor authentication required</h1>
        <p className="mt-3 text-sm text-slate-600">
          Admin access requires MFA (authenticator app). Enroll in your Supabase account security settings, then sign in again.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            I have enrolled — continue
          </Link>
          <Link href="/customer/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
