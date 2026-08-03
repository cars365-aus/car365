/**
 * fix-media-storage-keys.js
 *
 * The seed data created media_assets records with fake UUID-based storage_keys
 * that do not exist in Supabase Storage. The actual files live under
 * media/vehicles/<filename>. This script:
 *
 *  1. Lists all real files in the media/vehicles/ bucket folder.
 *  2. Filters out _compressed variants to prefer originals (or webp where no jpg).
 *  3. Updates media_assets.storage_key values to match real files, distributed
 *     evenly across the asset records so each vehicle gets real images.
 *
 * Run: node scripts/fix-media-storage-keys.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("🔍 Fetching all files in media/vehicles/ bucket...");

  // Paginate storage listing (max 1000 per request)
  let allFiles = [];
  let offset = 0;
  const pageSize = 200;
  while (true) {
    const { data, error } = await supabase.storage
      .from("media")
      .list("vehicles", { limit: pageSize, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    allFiles = allFiles.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`✅ Found ${allFiles.length} total files in storage`);

  // Prefer compressed webp if available, otherwise fall back to original
  // Build a map: base_name -> preferred filename
  const fileMap = new Map();
  for (const f of allFiles) {
    const name = f.name;
    if (name.endsWith("_compressed.webp")) {
      // strip suffix to get base key
      const base = name.replace("_compressed.webp", "");
      fileMap.set(base, name); // webp takes priority
    } else {
      const base = name.replace(/\.(jpg|jpeg|png|webp)$/i, "");
      if (!fileMap.has(base)) {
        fileMap.set(base, name);
      }
    }
  }

  const preferredFiles = Array.from(fileMap.values());
  console.log(`📦 ${preferredFiles.length} unique images (preferring compressed webp)`);

  // Fetch all media_assets records (these have fake storage_keys)
  const { data: assets, error: assetsErr } = await supabase
    .from("media_assets")
    .select("id, storage_key")
    .order("created_at");
  if (assetsErr) throw assetsErr;

  console.log(`📋 Found ${assets.length} media_asset records to update`);

  if (preferredFiles.length === 0) {
    console.error("❌ No real files found in storage. Aborting.");
    process.exit(1);
  }

  // Distribute real file paths across all media_asset records (round-robin)
  let updated = 0;
  let failed = 0;

  // Run updates in parallel with a concurrency limit of 20
  const CONCURRENCY = 20;
  for (let i = 0; i < assets.length; i += CONCURRENCY) {
    const batch = assets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (asset, j) => {
        const realFile = preferredFiles[(i + j) % preferredFiles.length];
        const newKey = `vehicles/${realFile}`;
        const { error } = await supabase
          .from("media_assets")
          .update({ storage_key: newKey })
          .eq("id", asset.id);
        return { asset, error };
      })
    );
    for (const { asset, error } of results) {
      if (error) {
        console.error(`  ❌ Failed to update ${asset.id}: ${error.message}`);
        failed++;
      } else {
        updated++;
      }
    }
    console.log(`  Progress: ${Math.min(i + CONCURRENCY, assets.length)}/${assets.length}`);
  }

  console.log(`\n✅ Done! Updated: ${updated}, Failed: ${failed}`);
  console.log("🔄 Please restart your dev server and refresh to see images.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
