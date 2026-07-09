import { redirect } from "next/navigation";

/** Legacy route — send admins to Supabase sign-in with MFA notice. */
export default function AdminLoginPage() {
  redirect("/auth/sign-in?redirectedFrom=/admin&reason=mfa-required");
}
