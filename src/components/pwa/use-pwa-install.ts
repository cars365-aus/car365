"use client";

import { useSyncExternalStore } from "react";

const INSTALLED_KEY = "hirecar_pwa_installed";
const INSTALLABLE_KEY = "hirecar_pwa_installable";
const VISIT_COUNT_KEY = "hirecar_visit_count";
const DISMISSED_KEY = "hirecar_a2hs_dismissed";
const MIN_VISITS = 2;

/**
 * Install states, in priority order:
 * - `standalone`   → running inside the installed app; hide all install UI.
 * - `installable`  → live `beforeinstallprompt` available → one-tap native install.
 * - `installed`    → installed before, currently in a browser tab.
 * - `manual`       → the browser supports install but has no live prompt right
 *                    now (prompt already dismissed, or Chrome is throttling it)
 *                    → offer manual instructions instead of a dead button.
 * - `ios`          → iOS Safari (no install API) — manual instructions.
 * - `unavailable`  → desktop/unsupported.
 */
export type PwaInstallMode =
  | "standalone"
  | "installable"
  | "installed"
  | "manual"
  | "ios"
  | "unavailable";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallSnapshot {
  mode: PwaInstallMode;
  /** Whether the auto-surfacing banner is allowed to appear (visit-gated). */
  bannerEligible: boolean;
}

// --- Module-level external store (browser state lives outside React) ---------

const SERVER_SNAPSHOT: PwaInstallSnapshot = { mode: "unavailable", bannerEligible: false };

let snapshot: PwaInstallSnapshot = SERVER_SNAPSHOT;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function detectStandalone(): boolean {
  const mm = (q: string) => window.matchMedia(q).matches;
  return (
    mm("(display-mode: standalone)") ||
    mm("(display-mode: fullscreen)") ||
    mm("(display-mode: minimal-ui)") ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  const ua = window.navigator.userAgent;
  const isIosDevice =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as MacIntel but has a touch screen.
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return isIosDevice && !/crios|fxios|edgios/i.test(ua);
}

function computeMode(): PwaInstallMode {
  if (detectStandalone()) return "standalone";
  // A live prompt is ground truth that the app is installable and NOT installed —
  // it must win over the persisted `installed` flag (there is no web "uninstall"
  // event, so that flag can be stale after the user removes the app).
  if (deferredPrompt) return "installable";
  if (safeGet(INSTALLED_KEY) === "1") return "installed";
  // Seen installable before but no live prompt now (dismissed / throttled) →
  // keep offering install via manual instructions rather than removing it.
  if (safeGet(INSTALLABLE_KEY) === "1") return "manual";
  if (detectIos()) return "ios";
  return "unavailable";
}

function commit(next: Partial<PwaInstallSnapshot>) {
  const merged = { ...snapshot, ...next };
  if (merged.mode === snapshot.mode && merged.bannerEligible === snapshot.bannerEligible) {
    return; // no change → keep referential stability for useSyncExternalStore
  }
  snapshot = merged;
  listeners.forEach((l) => l());
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (detectStandalone()) safeSet(INSTALLED_KEY, "1");

  // Banner eligibility: count this visit once, gate on dismissal + visit count.
  let bannerEligible = false;
  if (safeGet(DISMISSED_KEY) !== "true") {
    const visits = parseInt(safeGet(VISIT_COUNT_KEY) || "0", 10) + 1;
    safeSet(VISIT_COUNT_KEY, String(visits));
    bannerEligible = visits >= MIN_VISITS;
  }

  snapshot = { mode: computeMode(), bannerEligible };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    // The browser says it's installable → remember that, and clear any stale
    // "installed" flag left over from a previous install that was uninstalled.
    safeSet(INSTALLABLE_KEY, "1");
    safeRemove(INSTALLED_KEY);
    commit({ mode: computeMode() });
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    safeSet(INSTALLED_KEY, "1");
    safeRemove(INSTALLABLE_KEY);
    commit({ mode: computeMode() });
  });
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener?.("change", () => commit({ mode: computeMode() }));
}

function subscribe(cb: () => void): () => void {
  ensureInitialized();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Fire the native install prompt. Returns "unavailable" when there is no live
 * prompt (the caller should then show manual instructions).
 */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  // The event is single-use; once prompted it can't be reused.
  deferredPrompt = null;
  if (outcome === "accepted") {
    safeSet(INSTALLED_KEY, "1");
    safeRemove(INSTALLABLE_KEY);
  }
  // Recompute either way: on "dismissed" this drops to `manual` (INSTALLABLE_KEY
  // is still set) so the install option stays available instead of dying.
  commit({ mode: computeMode() });
  return outcome;
}

/** Mark the auto-banner dismissed so it won't resurface. */
export function dismissBanner() {
  safeSet(DISMISSED_KEY, "true");
  commit({ bannerEligible: false });
}

export function usePwaInstall(): PwaInstallSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}
