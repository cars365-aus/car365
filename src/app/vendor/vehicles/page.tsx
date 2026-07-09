import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext, getVehicleLimitInfo } from "@/lib/data/vendor";
import { getOrganizationVehicles, deleteVehicle, getVehicleFeatures } from "./actions";
import { getVehicleImages } from "./image-actions";
import VehicleForm from "./vehicle-form";
import { DeleteVehicleButton } from "./delete-button";
import { BulkUpload } from "@/components/vendor/bulk-upload";
import { OrgSwitcher } from "@/components/vendor/org-switcher";
import { organizationHasFeature } from "@/lib/plan-features";
import { Car, MapPin, Tag, Fuel, Settings2, Users, AlertCircle, Edit2, Eye } from "lucide-react";

export const metadata = {
  title: "Vehicles",
};

interface VehiclesPageProps {
  searchParams: Promise<{ org?: string; edit?: string; page?: string }>;
}

export default async function VendorVehiclesPage({ searchParams }: VehiclesPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const context = await getVendorContext(user.id);

  if (context.setupError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-800">Setup Required</h1>
        <p className="mt-2 text-red-700">{context.setupError}</p>
      </div>
    );
  }

  if (context.organizations.length === 0) {
    redirect("/vendor/upgrade");
  }

  const selectedOrgId = params.org || context.organizations[0]?.id;
  const organization = context.organizations.find((o) => o.id === selectedOrgId);

  if (!organization) {
    redirect("/vendor/vehicles?org=" + context.organizations[0]?.id);
  }

  const page = parseInt(params.page || "1", 10) || 1;
  const limitInfo = await getVehicleLimitInfo(selectedOrgId);
  const hasBulkUpload = await organizationHasFeature(selectedOrgId, "bulkUpload");
  const canUseAi = await organizationHasFeature(selectedOrgId, "aiSeoContent");
  const { vehicles, totalCount, pageSize } = await getOrganizationVehicles(selectedOrgId, page);

  let editVehicle: ((typeof vehicles)[number] & { features?: string[] }) | null = null;
  let editImages: Awaited<ReturnType<typeof getVehicleImages>> = [];
  if (params.edit) {
    const found = vehicles.find((v) => v.id === params.edit) ?? null;
    if (found) {
      const features = await getVehicleFeatures(params.edit, selectedOrgId);
      editVehicle = { ...found, features };
      editImages = await getVehicleImages(params.edit, selectedOrgId);
    }
  }

  const isAtLimit = limitInfo.hasLimit && limitInfo.currentCount >= (limitInfo.limit ?? 0);
  const usagePercent = limitInfo.limit ? Math.min((limitInfo.currentCount / limitInfo.limit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vehicles</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your fleet listings for <span className="font-medium text-slate-700">{organization.name}</span>.
            </p>
          </div>
          <OrgSwitcher
            organizations={context.organizations}
            selectedOrgId={selectedOrgId}
            basePath="/vendor/vehicles"
          />
        </div>

        {/* Plan Usage */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              Plan Limit <span className="text-slate-400 font-normal">({limitInfo.planCode || "Free"})</span>
            </span>
            <span className="text-sm font-medium text-slate-700">
              {limitInfo.currentCount} <span className="text-slate-400 font-normal">/ {limitInfo.limit ?? "∞"} vehicles</span>
            </span>
          </div>
          {limitInfo.hasLimit && (
            <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${isAtLimit ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {isAtLimit && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <p>You have reached your vehicle limit. <Link href="/vendor/billing" className="font-semibold underline hover:text-red-700">Upgrade your plan</Link> to add more.</p>
            </div>
          )}
        </div>
      </div>

      {!editVehicle && hasBulkUpload && (
        <BulkUpload
          organizationId={selectedOrgId}
          branches={organization.branches}
        />
      )}
      {!editVehicle && !hasBulkUpload && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Bulk upload is available on the <Link href="/vendor/billing" className="font-semibold text-orange-600 hover:underline">Pro plan</Link>.
        </div>
      )}

      {/* Vehicle Form */}
      <VehicleForm
        organizationId={selectedOrgId}
        branches={organization.branches}
        isAtLimit={isAtLimit}
        canUseAi={canUseAi}
        editVehicle={editVehicle}
        editImages={editImages}
      />

      {/* Vehicles List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-900">Your Fleet ({totalCount})</h2>
        </div>

        {vehicles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Car className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-900">No vehicles yet</p>
            <p className="text-sm text-slate-500 mt-1">Add your first vehicle using the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const branch = (vehicle as any).branches;
              return (
                <div key={vehicle.id} className="p-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 leading-none">{vehicle.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                        vehicle.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        vehicle.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Tag className="h-4 w-4 text-slate-400" />
                        ${vehicle.price_per_day_aud}/day
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {branch?.name} ({branch?.city})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <Car className="h-3.5 w-3.5" /> {vehicle.category}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <Users className="h-3.5 w-3.5" /> {vehicle.seats} seats
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <Settings2 className="h-3.5 w-3.5" /> {vehicle.transmission}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <Fuel className="h-3.5 w-3.5" /> {vehicle.fuel}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link
                      href={`/cars/${vehicle.slug}`}
                      target="_blank"
                      className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-brand-600 shadow-sm transition-all"
                      title="View Public Listing"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/vendor/vehicles?org=${selectedOrgId}&edit=${vehicle.id}`}
                      className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <DeleteVehicleButton vehicleId={vehicle.id} organizationId={selectedOrgId} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalCount > pageSize && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500 font-medium">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} vehicles
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/vendor/vehicles?org=${selectedOrgId}&page=${page - 1}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Previous
                </Link>
              )}
              {page * pageSize < totalCount && (
                <Link
                  href={`/vendor/vehicles?org=${selectedOrgId}&page=${page + 1}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
