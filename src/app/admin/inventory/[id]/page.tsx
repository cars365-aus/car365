import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { updateVehicle } from "@/app/admin/inventory/actions";
import { getMakes, getAllModels, getAllFeatures } from "@/lib/data/inventory";
import { getActiveLocations } from "@/lib/data/locations";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Edit Vehicle" };
export const dynamic = "force-dynamic";

export default async function EditVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const supabase = createAdminClient();

  const [{ data: vehicle }, { data: featureRows }, makes, models, features, locations] = await Promise.all([
    supabase.from("vehicles").select("*, makes:make_id(slug), models:model_id(slug), images:vehicle_images(is_cover, sort_order, media:media_assets!media_id(storage_key))").eq("id", id).maybeSingle(),
    supabase.from("vehicle_features").select("feature_id").eq("vehicle_id", id),
    getMakes(), getAllModels(), getAllFeatures(), getActiveLocations(),
  ]);
  if (!vehicle) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = vehicle as any;
  if (v.images) {
    v.images = v.images
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((img: any) => ({
        ...img,
        url: img.media?.storage_key ? supabase.storage.from("media").getPublicUrl(img.media.storage_key).data.publicUrl : "",
      }));
  }

  const selectedFeatureIds = ((featureRows ?? []) as { feature_id: string }[]).map((f) => f.feature_id);
  const vdpPath = `/used-cars/${v.makes?.slug}/${v.models?.slug}/${v.slug}`;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to inventory</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{v.year} — Stock #{v.stock_id}</h1>
          {created ? <p className="text-sm text-success">Vehicle created.</p> : null}
        </div>
        {v.status !== "draft" ? (
          <a href={vdpPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
            View live <ExternalLink className="size-4" />
          </a>
        ) : null}
      </div>
      <VehicleForm action={updateVehicle} makes={makes} models={models} features={features} locations={locations} vehicle={v} selectedFeatureIds={selectedFeatureIds} mode="edit" />
    </div>
  );
}
