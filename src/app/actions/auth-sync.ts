"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deriveProfileFromUser } from "@/lib/auth/profile";

/**
 * Syncs the authenticated user's `profiles` row.
 *
 * Reads the current user from the cookie-bound server client (the session is
 * present after a successful email/password or phone-OTP sign-in), derives the
 * profile payload, and upserts it via the service-role admin client (which
 * bypasses RLS).
 *
 * Returns `{ ok: false }` without upserting when there is no authenticated
 * user, so callers can avoid leaking details about missing sessions.
 */
export async function syncProfile(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert(deriveProfileFromUser(user));

  if (error) {
    console.error("[syncProfile] Profile upsert failed:", error.message);
    return { ok: false };
  }

  return { ok: true };
}
