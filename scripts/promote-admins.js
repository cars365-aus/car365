/**
 * scripts/promote-admins.js
 *
 * Sets admin roles for specific users in the `admin_roles` table.
 * Uses Supabase service role key (bypasses RLS).
 *
 * Usage:  node scripts/promote-admins.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ──────────────────────────────────────────────────────────────
// Users to promote  (email → role in admin_roles table)
// ──────────────────────────────────────────────────────────────
const TARGETS = [
  { email: "infinitewithbikash@gmail.com", role: "owner" },
  { email: "ybikash919@gmail.com",         role: "owner" },
  { email: "anandujjawal993@gmail.com",     role: "admin" },
];

async function ensureProfile(authUser) {
  // Make sure a profiles row exists (required by admin_roles FK)
  await supabase.from("profiles").upsert(
    {
      id:         authUser.id,
      email:      authUser.email,
      full_name:  authUser.user_metadata?.full_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

async function promoteUsers() {
  console.log("🔐  Fetching auth users…");

  const { data: listData, error: listErr } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (listErr) {
    console.error(`  ✗  Could not list auth users: ${listErr.message}`);
    process.exit(1);
  }

  const authUsers = listData.users;
  console.log(`   Found ${authUsers.length} auth users\n`);

  for (const target of TARGETS) {
    const authUser = authUsers.find(
      (u) => u.email?.toLowerCase() === target.email.toLowerCase(),
    );

    if (!authUser) {
      console.warn(`  ⚠  No auth user found for ${target.email} – skipping`);
      continue;
    }

    // 1. Ensure profile row exists (FK requirement)
    await ensureProfile(authUser);

    // 2. Upsert into admin_roles (conflict on user_id)
    const { error } = await supabase
      .from("admin_roles")
      .upsert(
        {
          user_id:      authUser.id,
          role:         target.role,
          active:       true,
          mfa_required: false,
        },
        { onConflict: "user_id" },
      );

    if (error) {
      console.error(`  ✗  ${target.email}: ${error.message}`);
    } else {
      console.log(`  ✓  ${target.email}  →  role="${target.role}"`);
    }
  }

  console.log("\nDone ✅");
}

promoteUsers().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
