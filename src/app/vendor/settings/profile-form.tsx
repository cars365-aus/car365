"use client";

import { useActionState } from "react";
import { updateOrganizationProfile } from "./actions";
import { Phone, Globe, MapPin } from "lucide-react";

type ProfileFormProps = {
  organizationId: string;
  defaultValues: {
    name: string;
    phone: string;
    website: string;
    address: string;
  };
};

export function ProfileForm({ organizationId, defaultValues }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateOrganizationProfile, { error: null, success: false });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
          Organization profile updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Business Name</label>
        <input
          id="name"
          name="name"
          defaultValue={defaultValues.name}
          required
          minLength={2}
          maxLength={160}
          autoComplete="organization"
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all aria-invalid:border-destructive"
          placeholder="Your business name"
          aria-describedby="name-helper"
        />
        <p id="name-helper" className="mt-1.5 text-xs text-muted-foreground">Displayed on your public profile</p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
          <Phone className="inline h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={defaultValues.phone}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all aria-invalid:border-destructive"
          placeholder="+61 4XX XXX XXX"
          aria-describedby="phone-helper"
        />
        <p id="phone-helper" className="mt-1.5 text-xs text-muted-foreground">Visible to customers for direct contact</p>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1.5">
          <Globe className="inline h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          inputMode="url"
          autoComplete="url"
          defaultValue={defaultValues.website}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all aria-invalid:border-destructive"
          placeholder="https://yourwebsite.com.au"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1.5">
          <MapPin className="inline h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          Business Address
        </label>
        <input
          id="address"
          name="address"
          autoComplete="street-address"
          defaultValue={defaultValues.address}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all aria-invalid:border-destructive"
          placeholder="123 Main St, Sydney NSW 2000"
          aria-describedby="address-helper"
        />
        <p id="address-helper" className="mt-1.5 text-xs text-muted-foreground">Used for business verification</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
