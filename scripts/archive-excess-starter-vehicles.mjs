import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const STARTER_VEHICLE_LIMIT = 5;

/**
 * Pure function: given a list of vehicles (with id and updated_at),
 * returns the IDs of vehicles that should be archived — i.e. all
 * beyond the `limit` most-recently-updated.
 *
 * @param {Array<{ id: string; updated_at: string }>} vehicles
 * @param {number} limit
 * @returns {string[]} IDs to archive
 */
export function selectVehiclesToArchive(vehicles, limit) {
  const sorted = [...vehicles].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  return sorted.slice(limit).map((v) => v.id);
}

// ─── Main script ────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // 1. Find all organizations on starter plan with more than 5 active vehicles
  const { data: orgs, error: orgsError } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("plan_code", "starter")
    .in("status", ["active", "trialing"]);

  if (orgsError) {
    console.error("Failed to query starter subscriptions:", orgsError.message);
    process.exit(1);
  }

  if (!orgs?.length) {
    console.log("No active starter subscriptions found.");
    process.exit(0);
  }

  const orgIds = orgs.map((o) => o.organization_id);
  console.log(`Found ${orgIds.length} org(s) on starter plan. Checking vehicle counts...`);

  let totalArchived = 0;

  for (const orgId of orgIds) {
    // 2. Get all approved vehicles for this org, sorted by updated_at DESC
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id, updated_at")
      .eq("organization_id", orgId)
      .eq("status", "approved")
      .order("updated_at", { ascending: false });

    if (vehiclesError) {
      console.error(`  [${orgId}] Failed to query vehicles:`, vehiclesError.message);
      continue;
    }

    if (!vehicles || vehicles.length <= STARTER_VEHICLE_LIMIT) {
      continue;
    }

    // 3. Select vehicles to archive (all beyond the 5 most recent)
    const idsToArchive = selectVehiclesToArchive(vehicles, STARTER_VEHICLE_LIMIT);

    console.log(`  [${orgId}] Has ${vehicles.length} active vehicles, archiving ${idsToArchive.length}...`);

    // 4. Archive the excess vehicles
    const { error: archiveError } = await supabase
      .from("vehicles")
      .update({ status: "archived" })
      .in("id", idsToArchive);

    if (archiveError) {
      console.error(`  [${orgId}] Failed to archive vehicles:`, archiveError.message);
      continue;
    }

    // 5. Log to audit_logs table
    const auditEntries = idsToArchive.map((vehicleId) => ({
      organization_id: orgId,
      action: "vehicle_archived",
      details: JSON.stringify({
        reason: "starter_plan_limit_reduction",
        vehicle_id: vehicleId,
        new_limit: STARTER_VEHICLE_LIMIT,
      }),
    }));

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert(auditEntries);

    if (auditError) {
      console.warn(`  [${orgId}] Failed to write audit logs:`, auditError.message);
      // Non-fatal: continue even if audit logging fails
    }

    totalArchived += idsToArchive.length;
    console.log(`  [${orgId}] Archived ${idsToArchive.length} vehicle(s). Audit logged.`);
  }

  console.log(`\nDone. Archived ${totalArchived} excess vehicle(s) across all starter orgs.`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
