"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleSavedVehicle } from "@/app/actions/saved-vehicles";
import { createBrowserClient } from "@supabase/ssr";

interface SavedVehicleButtonProps {
  vehicleId: string;
  initialSaved?: boolean;
  className?: string;
}

export function SavedVehicleButton({
  vehicleId,
  initialSaved = false,
  className = "",
}: SavedVehicleButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = `/auth/sign-in?redirectedFrom=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleSavedVehicle(vehicleId);
      setSaved(result.saved);
    } catch {
      // ignore — user may not be logged in
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={saved ? "Remove from saved" : "Save vehicle"}
      className={`touch-target flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm hover:scale-105 transition-transform ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <Heart
          className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-slate-500"}`}
        />
      )}
    </button>
  );
}
