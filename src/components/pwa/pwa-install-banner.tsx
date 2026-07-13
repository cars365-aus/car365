"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall, promptInstall, dismissBanner } from "./use-pwa-install";
import { useMobileState } from "@/components/mobile-state-provider";
import { IosInstallSheet } from "./ios-install-sheet";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SHOW_DELAY_MS = 2500;

/**
 * Auto-surfacing install prompt — a polished floating card, not a full-width
 * bar. Appears after a couple of visits for installable (Android) or iOS
 * users, never when already installed, and stays out of the way of the mobile
 * nav, modals, and the sticky CTA. Dismissal is remembered; the side-menu
 * entry remains available for manual install afterwards.
 */
export function PwaInstallBanner() {
  const { mode, bannerEligible } = usePwaInstall();
  const { isMobileNavOpen, isModalOpen, isStickyCtaVisible } = useMobileState();
  const prefersReduced = useReducedMotion();

  const [shown, setShown] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  const canShow = bannerEligible && (mode === "installable" || mode === "ios");

  // Reveal after a short delay so it doesn't fight the initial paint.
  useEffect(() => {
    if (!canShow) return;
    const t = setTimeout(() => setShown(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [canShow]);

  if (!canShow) return null;

  const hiddenByOverlay = isMobileNavOpen || isModalOpen;

  const dismiss = () => {
    setShown(false);
    dismissBanner();
  };

  const handlePrimary = async () => {
    if (mode === "ios") {
      setIosSheetOpen(true);
      return;
    }
    const outcome = await promptInstall();
    // No live prompt (already used / throttled) → show manual instructions
    // instead of doing nothing; otherwise close the banner.
    if (outcome === "unavailable") {
      setIosSheetOpen(true);
    } else {
      setShown(false);
    }
  };

  // Lift above the vehicle-detail sticky CTA when it's visible.
  const bottomOffset = isStickyCtaVisible ? "5.75rem" : "0px";

  return (
    <>
      <div
        className={`fixed left-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 will-change-transform
          ${prefersReduced ? "" : "transition-all duration-300 ease-out"}
          ${shown && !hiddenByOverlay ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-6 opacity-0"}`}
        style={{ bottom: `calc(${bottomOffset} + 1rem + env(safe-area-inset-bottom))` }}
        role="dialog"
        aria-label="Install HireCar app"
      >
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_18px_50px_-12px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3 p-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              aria-hidden="true"
              className="h-12 w-12 shrink-0 rounded-xl border border-border"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">Install HireCar</p>
              <p className="truncate text-xs text-muted-foreground">
                {mode === "ios"
                  ? "Add to your home screen for a faster, app-like experience."
                  : "Faster access, offline-ready, no app store needed."}
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 border-t border-border p-2.5">
            <button
              onClick={handlePrimary}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#ea580c] to-[#c2410c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all min-h-[44px]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {mode === "ios" ? "How to install" : "Install app"}
            </button>
            <button
              onClick={dismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <IosInstallSheet
        open={iosSheetOpen}
        onClose={() => setIosSheetOpen(false)}
        variant={mode === "ios" ? "ios" : "generic"}
      />
    </>
  );
}
