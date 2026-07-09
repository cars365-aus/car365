"use client";

import { useActionState, useRef, useState } from "react";
import { updateBrandProfile } from "./actions";
import { ImageIcon } from "lucide-react";

export function BrandForm({ organizationId, defaultBio, defaultLogoUrl }: { organizationId: string, defaultBio?: string | null, defaultLogoUrl?: string | null }) {
  const [state, formAction, isPending] = useActionState<any, FormData>(updateBrandProfile, { error: null });
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <input type="hidden" name="organizationId" value={organizationId} />
      
      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
          Brand profile updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-foreground mb-1.5">Brand Logo</label>
        <div className="flex items-center gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted hover:border-muted-foreground/30 transition-colors overflow-hidden"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <input 
              type="file" 
              id="logo" 
              name="logo" 
              accept="image/png, image/jpeg, image/svg+xml" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-primary hover:text-primary/80">Upload Image</button>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1.5">About Us (Bio)</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio || ""}
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
          placeholder="Tell customers about your fleet, service quality, and history..."
          aria-describedby="bio-helper"
        />
        <p id="bio-helper" className="mt-1.5 text-xs text-muted-foreground">Displayed on your public vendor profile page</p>
      </div>
      
      <button disabled={isPending} type="submit" className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50">
        {isPending ? "Saving..." : "Save Profile Settings"}
      </button>
    </form>
  );
}
