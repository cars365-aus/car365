"use server";

import { redirect } from "next/navigation";

/** Legacy admin-login route — redirect to Supabase sign-in. */
export async function loginAdmin(
  _prevState: unknown,
  _formData: FormData,
) {
  redirect("/auth/sign-in?redirectedFrom=/admin");
}

export async function logoutAdmin() {
  redirect("/auth/sign-out");
}
