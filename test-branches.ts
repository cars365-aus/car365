import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("branches")
    .select("id, organization_id, name, city, state, address, status, phone, whatsapp")
    .in("organization_id", ["18938dfb-00e2-4cf6-ad30-27bbf62fa000", "b08357b7-887e-4b79-a810-e55da0bdc963"])
    .order("created_at", { ascending: true });

  console.log("Error:", error);
  console.log("Data:", data ? JSON.stringify(data, null, 2) : "null");
}

main().catch(console.error);
