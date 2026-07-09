"use client";

import { useState, useTransition } from "react";
import { BranchForm, type BranchData } from "./branch-form";
import { MapPin, Phone, Edit, Trash2 } from "lucide-react";
import { deleteBranch } from "./actions";

export function BranchCard({ branch, organizationId }: { branch: BranchData & { status: string }, organizationId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!branch) return null;

  try {
    if (isEditing) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex justify-between items-center">
            <h4 className="font-semibold text-slate-900">Edit Branch</h4>
          </div>
          <BranchForm 
            organizationId={organizationId} 
            branch={branch} 
            onSuccess={() => setIsEditing(false)} 
          />
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-500 shrink-0" />
            <h4 className="font-bold text-slate-900">{branch.name || 'Unnamed Branch'}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              branch.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
              "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {branch.status || 'pending'}
            </span>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Edit branch"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              disabled={isPending}
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this branch?")) {
                  startTransition(async () => {
                    try {
                      await deleteBranch(branch.id, organizationId);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Failed to delete branch");
                    }
                  });
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete branch"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2 pl-7">
          <p className="text-sm text-slate-600">
            {branch.city || ''}{branch.state ? `, ${branch.state}` : ''}
          </p>
          <p className="text-sm text-slate-500 truncate" title={branch.address || ''}>
            {branch.address || ''}
          </p>
          {(branch.phone || branch.whatsapp) && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
              {branch.phone && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {branch.phone}
                </span>
              )}
              {branch.whatsapp && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-green-500 font-bold">WA</span> {branch.whatsapp}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error in BranchCard:", err);
    return <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">Error displaying branch</div>;
  }
}
