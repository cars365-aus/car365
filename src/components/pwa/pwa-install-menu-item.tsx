"use client";

import { useState } from "react";
import { Download, Share, CheckCircle2 } from "lucide-react";
import { usePwaInstall, promptInstall } from "./use-pwa-install";
import { IosInstallSheet } from "./ios-install-sheet";

/**
 * Install entry for the mobile navigation drawer. Adapts to the current state:
 * - installable → one-tap "Install app" (native prompt)
 * - manual      → "Install app" (native prompt unavailable → instructions)
 * - ios         → "Add to Home Screen" (instructions)
 * - installed   → subtle "App installed" confirmation
 * - standalone / unavailable → renders nothing
 */
export function PwaInstallMenuItem() {
  const { mode } = usePwaInstall();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (mode === "standalone" || mode === "unavailable") return null;

  if (mode === "installed") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">App installed</p>
          <p className="text-xs text-emerald-700">Open HireCar from your home screen.</p>
        </div>
      </div>
    );
  }

  const isIos = mode === "ios";

  const handleClick = async () => {
    if (isIos) {
      setSheetOpen(true);
      return;
    }
    // installable / manual: try the native prompt; if it isn't available
    // (already used or throttled), fall back to manual instructions.
    const outcome = await promptInstall();
    if (outcome === "unavailable") setSheetOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white px-4 py-3 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md min-h-[56px] touch-target"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 rounded-xl border border-orange-100" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">
            {isIos ? "Add to Home Screen" : "Install app"}
          </p>
          <p className="truncate text-xs text-slate-500">
            Faster access · offline-ready · no app store
          </p>
        </div>
        {isIos ? (
          <Share className="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
        ) : (
          <Download className="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
        )}
      </button>

      <IosInstallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        variant={isIos ? "ios" : "generic"}
      />
    </>
  );
}
