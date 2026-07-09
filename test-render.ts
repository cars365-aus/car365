import { getVendorContext } from "./src/lib/data/vendor";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  // Test with user ID that belongs to the organizations in the database
  // We can just query organization_members to find one
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: member } = await supabase.from("organization_members").select("user_id").limit(1).single();
  
  if (!member) {
    console.log("No organization members found to test with.");
    return;
  }

  console.log("Testing with user_id:", member.user_id);
  
  try {
    const context = await getVendorContext(member.user_id);
    console.log("Success! Organizations count:", context.organizations.length);
    console.log("First organization branches count:", context.organizations[0]?.branches.length);
  } catch (err) {
    console.error("Crash during getVendorContext:", err);
  }
}

main().catch(console.error);
