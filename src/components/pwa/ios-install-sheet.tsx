"use client";

import { useEffect } from "react";
import { Share, Plus, MoreVertical, X } from "lucide-react";

type Variant = "ios" | "generic";

/**
 * Bottom sheet with step-by-step install instructions, used when there is no
 * live `beforeinstallprompt` to fire:
 * - `ios`     → iOS Safari (Share → Add to Home Screen)
 * - `generic` → Android/desktop where Chrome is throttling its prompt
 *               (browser menu → Install app)
 */
export function IosInstallSheet({
  open,
  onClose,
  variant = "ios",
}: {
  open: boolean;
  onClose: () => void;
  variant?: Variant;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Install instructions">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="h-12 w-12 rounded-xl border border-border" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Install HireCar</h2>
            <p className="text-sm text-muted-foreground">
              {variant === "ios"
                ? "Add it to your home screen in two steps."
                : "Add it from your browser menu in two steps."}
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-4">
          {variant === "ios" ? (
            <>
              <li className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
                <p className="text-sm text-muted-foreground">
                  Tap the <span className="font-semibold text-foreground">Share</span> button
                  <Share className="mx-1 inline h-4 w-4 -mt-0.5 text-blue-600" aria-hidden="true" />
                  in Safari&apos;s toolbar.
                </p>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
                <p className="text-sm text-muted-foreground">
                  Choose
                  <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to Home Screen
                  </span>
                  .
                </p>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
                <p className="text-sm text-muted-foreground">
                  Open your browser menu
                  <MoreVertical className="mx-1 inline h-4 w-4 -mt-0.5 text-slate-600" aria-hidden="true" />
                  (top-right).
                </p>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
                <p className="text-sm text-muted-foreground">
                  Choose
                  <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Install app
                  </span>
                  (or &ldquo;Add to Home screen&rdquo;).
                </p>
              </li>
            </>
          )}
        </ol>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
