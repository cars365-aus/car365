"use client";

import { useActionState, useEffect } from "react";
import { createBranch, updateBranch } from "./actions";

export type BranchData = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone?: string | null;
  whatsapp?: string | null;
};

export function BranchForm({ 
  organizationId,
  branch,
  onSuccess
}: { 
  organizationId: string;
  branch?: BranchData;
  onSuccess?: () => void;
}) {
  const actionToUse = branch ? updateBranch : createBranch;
  const [state, formAction, isPending] = useActionState<any, FormData>(actionToUse, { error: null, success: false });

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      {branch && <input type="hidden" name="id" value={branch.id} />}
      
      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Branch name" name="name" defaultValue={branch?.name} placeholder="e.g. Sydney Airport" className="lg:col-span-1" helper="A recognisable pickup location name" />
        <Field label="City" name="city" defaultValue={branch?.city} placeholder="e.g. Sydney" />
        <Field label="State" name="state" defaultValue={branch?.state} placeholder="e.g. NSW" helper="Australian state or territory abbreviation" />
        <Field label="Phone" name="phone" defaultValue={branch?.phone || ""} required={false} placeholder="e.g. 02 1234 5678" helper="Visible to customers for direct contact" />
        <Field label="WhatsApp" name="whatsapp" defaultValue={branch?.whatsapp || ""} required={false} placeholder="e.g. +61434930437" helper="Include country code for WhatsApp click-to-chat" />
        <Field label="Address" name="address" defaultValue={branch?.address} className="md:col-span-2 lg:col-span-3" placeholder="Full street address" helper="Used for map display and directions" />
      </div>
      <div className="mt-6 pt-6 border-t border-border flex gap-3">
        <button disabled={isPending} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50">
          {isPending ? "Saving..." : branch ? "Update Branch" : "Save Branch for Review"}
        </button>
        {onSuccess && (
          <button type="button" onClick={onSuccess} disabled={isPending} className="rounded-xl border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  className = "",
  required = true,
  placeholder = "",
  defaultValue = "",
  helper,
}: {
  label: string;
  name: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-describedby={helper ? `${name}-helper` : undefined}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-normal text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all aria-invalid:border-destructive aria-invalid:ring-destructive/20"
      />
      {helper && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}
