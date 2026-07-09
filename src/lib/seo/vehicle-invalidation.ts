import type { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePseo } from "./invalidate";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function invalidatePseoForVehicle(
  supabase: AdminClient,
  vehicleId: string,
) {
  const { data } = await supabase
    .from("vehicles")
    .select("slug, category, make, branches(city)")
    .eq("id", vehicleId)
    .maybeSingle();

  if (!data) return;

  type BranchRecord = { city: string } | null;
  const branch = data.branches as unknown as BranchRecord;

  await invalidatePseo({
    vehicleSlug: data.slug,
    category: data.category,
    city: branch?.city,
    make: data.make,
  });
}
