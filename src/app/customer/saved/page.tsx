import Link from "next/link";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VehicleCard } from "@/components/vehicle-card";
import { resolveVehicleImage } from "@/lib/image-utils";
import type { VehicleImageRecord } from "@/lib/image-utils";

export const metadata = { title: "Saved Vehicles | Hire Car" };

export default async function SavedVehiclesPage() {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: saved } = await supabase
    .from("saved_vehicles")
    .select(`
      vehicle_id,
      vehicles(
        id, slug, title, make, model, year, seats, fuel, transmission, category,
        price_per_day_aud, instant_book, status,
        branches(city, state, name),
        organizations(name, slug, verified_at),
        vehicle_images(storage_path, approved, sort_order)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const vehicles = (saved ?? [])
    .map((row) => {
      type V = {
        id: string; slug: string; title: string; make: string; model: string; year: number;
        seats: number; fuel: string; transmission: string; category: string;
        price_per_day_aud: number; instant_book: boolean; status: string;
        branches: { city: string; state: string; name: string };
        organizations: { name: string; slug: string; verified_at: string | null };
        vehicle_images: VehicleImageRecord[];
      };
      const v = row.vehicles as unknown as V | null;
      if (!v || v.status !== "approved") return null;
      const imgs = v.vehicle_images ?? [];
      return {
        id: v.id,
        slug: v.slug,
        title: v.title,
        make: v.make,
        model: v.model,
        year: v.year,
        city: v.branches?.city ?? "",
        state: v.branches?.state ?? "",
        pricePerDayAud: v.price_per_day_aud,
        seats: v.seats,
        fuel: v.fuel,
        transmission: v.transmission,
        category: v.category,
        imageUrl: resolveVehicleImage(supabaseUrl, imgs, v.category),
        vendorName: v.organizations?.name ?? "",
        vendorSlug: v.organizations?.slug ?? "",
        branchName: v.branches?.name ?? "",
        verified: !!v.organizations?.verified_at,
        instantBook: v.instant_book,
      };
    })
    .filter(Boolean);

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-black text-slate-900">Saved Vehicles</h1>
      <p className="mt-1 text-slate-500">Vehicles you have bookmarked for later.</p>

      {vehicles.length === 0 ? (
        <div className="mt-10 text-center py-16 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-600 font-medium">No saved vehicles yet.</p>
          <Link href="/search" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">
            Browse vehicles
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v!.id} vehicle={v!} />
          ))}
        </div>
      )}
    </div>
  );
}
