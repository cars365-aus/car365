// import removed
import { getCurrentVendorContext } from "./actions";
import { BranchForm } from "./branch-form";
import { BranchCard } from "./branch-card";
import { GitBranch, MapPin, Phone, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function VendorBranchesPage() {
  const context = await getCurrentVendorContext();
  
  if (context.organizations.length === 0) {
    redirect("/vendor/upgrade");
  }

  const firstOrganization = context.organizations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your pickup locations. Vehicles belong to branches so public visibility and lead routing remain precise.
        </p>
      </div>

      {context.setupError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{context.setupError}</p>
        </div>
      )}

      {context.organizations.map((organization) => {
        const isApproved = organization.status === "approved";
        return (
          <div key={organization.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Org Header */}
            <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-xl font-bold text-slate-900 shadow-sm">
                  {organization.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{organization.name}</h2>
                  <p className="text-sm text-slate-500">ABN {organization.abn}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                isApproved ? "bg-emerald-100 text-emerald-700" :
                organization.status === "pending" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {isApproved ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {organization.status}
              </span>
            </div>

            {/* Branches List */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-slate-400" />
                Active Branches ({organization.branches.length})
              </h3>
              
              {organization.branches.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  <p className="text-sm text-slate-500">No branches added yet. Add one below.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {organization.branches.map((branch) => (
                    <BranchCard 
                      key={branch.id} 
                      branch={branch as any} 
                      organizationId={organization.id} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {firstOrganization && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-amber-500" />
              Add New Branch
            </h2>
          </div>
          
          <BranchForm organizationId={firstOrganization.id} />
        </div>
      )}
    </div>
  );
}

