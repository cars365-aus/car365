import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join } from "path";
dotenv.config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function runTest() {
  console.log("Testing DB logic for Bulk Upload...");

  const mockRows = [
    {
      stock_id: "TEST-100",
      make: "Toyota",
      model: "Camry",
      variant: "LE",
      year: 2023,
      mileage_km: 15000,
      fuel_type: "petrol",
      transmission: "automatic",
      body_type: "sedan",
      drive_type: "fwd",
      price: 25000,
      exterior_color: "Silver",
      description: "Test vehicle"
    },
    {
      stock_id: "TEST-200",
      make: "NewBrandName",
      model: "NewModelName",
      variant: "Sport",
      year: 2024,
      mileage_km: 100,
      fuel_type: "electric",
      transmission: "automatic",
      body_type: "suv",
      drive_type: "awd",
      price: 50000,
      exterior_color: "Black",
      description: "Brand new test vehicle"
    }
  ];

  for (const d of mockRows) {
    console.log(`\nProcessing ${d.stock_id}...`);
    
    // Resolve Make
    let makeId;
    const makeSlug = slugify(d.make);
    const { data: existingMake } = await supabase.from("makes").select("*").eq("slug", makeSlug).maybeSingle();
    
    if (existingMake) {
      console.log(`  Found existing make: ${existingMake.name}`);
      makeId = existingMake.id;
    } else {
      console.log(`  Creating new make: ${d.make}`);
      const { data: newMake, error: makeError } = await supabase.from("makes")
        .insert({ name: d.make, slug: makeSlug, is_popular: false })
        .select("id, name, slug")
        .single();
      if (makeError) throw makeError;
      makeId = newMake.id;
    }

    // Resolve Model
    let modelId;
    const modelSlug = slugify(d.model);
    const { data: existingModel } = await supabase.from("models").select("*").eq("slug", modelSlug).eq("make_id", makeId).maybeSingle();
    
    if (existingModel) {
      console.log(`  Found existing model: ${existingModel.name}`);
      modelId = existingModel.id;
    } else {
      console.log(`  Creating new model: ${d.model}`);
      const { data: newModel, error: modelError } = await supabase.from("models")
        .insert({ make_id: makeId, name: d.model, slug: modelSlug })
        .select("id, make_id, name, slug")
        .single();
      if (modelError) throw modelError;
      modelId = newModel.id;
    }

    const vehicleSlug = slugify(`${d.year}-${makeSlug}-${modelSlug}-${d.variant ?? ""}-${d.stock_id}`);

    console.log(`  Inserting vehicle: ${vehicleSlug}`);
    const vehicleRow = {
      stock_id: d.stock_id,
      slug: vehicleSlug,
      make_id: makeId,
      model_id: modelId,
      variant: d.variant,
      year: d.year,
      mileage_km: d.mileage_km,
      fuel_type: d.fuel_type,
      transmission: d.transmission,
      body_type: d.body_type,
      drive_type: d.drive_type,
      price: d.price,
      exterior_color: d.exterior_color,
      description: d.description,
      status: "draft",
      is_featured: false,
      roadworthy_included: false,
      finance_available: true,
      trade_in_welcome: true,
      inspection_available: true,
    };

    const { error: insertError } = await supabase.from("vehicles").insert(vehicleRow);
    
    if (insertError) {
      if (insertError.code === "23505") {
         console.log(`  Warning: duplicate stock ID ${d.stock_id}`);
      } else {
         throw insertError;
      }
    } else {
      console.log(`  Successfully inserted ${d.stock_id}`);
    }
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await supabase.from("vehicles").delete().in("stock_id", ["TEST-100", "TEST-200"]);
  await supabase.from("models").delete().eq("slug", "newmodelname");
  await supabase.from("makes").delete().eq("slug", "newbrandname");
  
  console.log("Test finished successfully.");
}

runTest().catch(console.error);
