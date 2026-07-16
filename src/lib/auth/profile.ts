import type { User } from "@supabase/supabase-js";

/**
 * Shape of the payload upserted into the `profiles` table for an authenticated
 * user, regardless of which auth method (Google, email, phone) they used.
 *
 * All identity fields are null-safe: phone-only users have no email, and
 * Google/email users have no phone.
 */
export interface ProfileUpsert {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

/**
 * Pure mapping from a Supabase user to the `profiles` upsert payload.
 *
 * Derivation rules:
 * - `id`         = `user.id`
 * - `email`      = `user.email ?? null` (phone-only users have no email)
 * - `phone`      = `user.phone ?? null` (Google/email users have no phone)
 * - `full_name`  = `user_metadata.full_name ?? user_metadata.name ?? null`
 * - `updated_at` = current ISO-8601 timestamp
 *
 * This function is total and never throws for users lacking an email,
 * a phone, or metadata fields.
 */
export function deriveProfileFromUser(user: User): ProfileUpsert {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    full_name: metadata.full_name ?? metadata.name ?? null,
    avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    updated_at: new Date().toISOString(),
  };
}
