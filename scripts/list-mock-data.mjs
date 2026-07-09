import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, title, make, model, organizations(name)");
    
  const mockVehicles = vehicles.filter(v => v.model?.includes("Model") || v.title?.match(/SUV \d{4}|Sedan \d{4}|Van \d{4}|Luxury \d{4}|People mover \d{4}|Ute \d{4}/));
  
  const idsToDelete = mockVehicles.map(v => v.id);
  
  console.log(`Found ${idsToDelete.length} mock vehicles to delete.`);
  
  if (idsToDelete.length > 0) {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .in("id", idsToDelete);
      
    if (error) {
      console.error("Error deleting mock vehicles:", error);
    } else {
      console.log("Successfully deleted mock vehicles.");
    }
  }
}

main().catch(console.error);
