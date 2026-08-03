/**
 * One-time / maintenance: grant DB staff access (an active `admin_roles` row)
 * to one or more users by email.
 *
 * WHY: `app_private.is_staff()` — the gate behind every admin RLS policy,
 * including Storage uploads to the `media` bucket — checks ONLY for an active
 * `admin_roles` row. The `ADMIN_EMAIL_ALLOWLIST` env var lets people into the
 * /admin UI, but Postgres can't see env vars, so an allowlist-only admin gets
 * "new row violates row-level security policy" on any write. This reconciles
 * the two by seeding the DB role.
 *
 * Usage:
 *   node scripts/grant-admin-role.mjs <email> [email2 ...]
 *   ROLE=owner node scripts/grant-admin-role.mjs alice@example.com
 *
 * Runs with the service-role key (bypasses RLS). Targets whatever project
 * .env.local points at. Users who haven't signed in yet (no auth account) are
 * reported and skipped — they must log in once so an auth user exists.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const ROLE = (process.env.ROLE || "admin").toLowerCase();
const VALID_ROLES = ["owner", "admin", "manager", "sales", "content"];
if (!VALID_ROLES.includes(ROLE)) {
  console.error(`Invalid ROLE "${ROLE}". Must be one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("Usage: node scripts/grant-admin-role.mjs <email> [email2 ...]   (ROLE=owner|admin|manager|sales|content optional)");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Resolve emails -> auth users via the admin API (paginated).
const wanted = new Set(emails.map((e) => e.trim().toLowerCase()));
const found = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("auth.admin.listUsers failed:", error.message);
    process.exit(1);
  }
  for (const u of data.users) {
    if (u.email && wanted.has(u.email.toLowerCase())) found.set(u.email.toLowerCase(), u);
  }
  if (data.users.length < 1000) break;
}

let granted = 0;
for (const email of emails) {
  const u = found.get(email.trim().toLowerCase());
  if (!u) {
    console.warn(`SKIP  ${email} — no auth account yet (they must sign in once first)`);
    continue;
  }
  const { error: pErr } = await supabase
    .from("profiles")
    .upsert({ id: u.id, email: u.email }, { onConflict: "id" });
  if (pErr) {
    console.error(`FAIL  ${email} — profiles upsert: ${pErr.message}`);
    continue;
  }
  const { error: rErr } = await supabase
    .from("admin_roles")
    .upsert({ user_id: u.id, role: ROLE, active: true }, { onConflict: "user_id" });
  if (rErr) {
    console.error(`FAIL  ${email} — admin_roles upsert: ${rErr.message}`);
    continue;
  }
  console.log(`OK    ${email} -> ${ROLE} (user ${u.id})`);
  granted++;
}
console.log(`Done. ${granted}/${emails.length} granted.`);
