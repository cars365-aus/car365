"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Maximum number of elements allowed to animate simultaneously on a
 * Mobile_Viewport during scroll. Limiting concurrency prevents frame drops
 * and battery drain on lower-powered devices.
 *
 * @validates Requirements 11.3
 */
export const MAX_CONCURRENT_MOBILE_ANIMATIONS = 3;

/**
 * Maximum duration (in seconds) for any animation on a Mobile_Viewport.
 * Page transition animations must complete within 300ms.
 *
 * @validates Requirements 11.4
 */
export const MOBILE_MAX_ANIMATION_DURATION = 0.3;

interface MobileAnimationContextValue {
  /** OS-level reduced-motion preference. When true, non-essential animations are disabled. */
  prefersReducedMotion: boolean;
  /** Whether the current viewport is a Mobile_Viewport (≤767px). */
  isMobile: boolean;
  /** The mobile concurrency cap (exposed for testing/inspection). */
  maxConcurrent: number;
  /**
   * Attempt to reserve an animation slot. Returns `true` if a slot was granted
   * (the caller may animate) or `false` if the concurrency cap has been reached
   * (the caller should render its final state without animating).
   * On desktop, slots are effectively unlimited.
   */
  acquireSlot: () => boolean;
  /** Release a previously acquired animation slot once the animation completes. */
  releaseSlot: () => void;
}

/**
 * Safe default used when a consumer is rendered outside a provider. It degrades
 * to "always animate" (the pre-governance behaviour) so components never crash.
 */
const DEFAULT_CONTEXT: MobileAnimationContextValue = {
  prefersReducedMotion: false,
  isMobile: false,
  maxConcurrent: MAX_CONCURRENT_MOBILE_ANIMATIONS,
  acquireSlot: () => true,
  releaseSlot: () => {},
};

const MobileAnimationContext =
  createContext<MobileAnimationContextValue>(DEFAULT_CONTEXT);

const MOBILE_QUERY = "(max-width: 767px)";

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(MOBILE_QUERY);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

/**
 * Provides mobile animation governance to descendant components:
 *  - exposes the OS reduced-motion preference (Req 11.2)
 *  - limits concurrent animating elements to 3 on mobile during scroll (Req 11.3)
 *
 * @validates Requirements 11.2, 11.3
 */
export function MobileAnimationProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobileViewport();
  const activeCountRef = useRef(0);

  const acquireSlot = useCallback(() => {
    // Desktop/tablet: no concurrency cap.
    if (!isMobile) {
      activeCountRef.current += 1;
      return true;
    }
    if (activeCountRef.current >= MAX_CONCURRENT_MOBILE_ANIMATIONS) {
      return false;
    }
    activeCountRef.current += 1;
    return true;
  }, [isMobile]);

  const releaseSlot = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
  }, []);

  return (
    <MobileAnimationContext.Provider
      value={{
        prefersReducedMotion,
        isMobile,
        maxConcurrent: MAX_CONCURRENT_MOBILE_ANIMATIONS,
        acquireSlot,
        releaseSlot,
      }}
    >
      {children}
    </MobileAnimationContext.Provider>
  );
}

/**
 * Access the mobile animation governance context. Returns a safe default when
 * used outside a {@link MobileAnimationProvider}.
 */
export function useMobileAnimation(): MobileAnimationContextValue {
  return useContext(MobileAnimationContext);
}

/**
 * Clamp an animation duration so that on a Mobile_Viewport it never exceeds
 * {@link MOBILE_MAX_ANIMATION_DURATION} (300ms). Desktop durations pass through
 * unchanged. Negative inputs are floored at 0.
 *
 * @validates Requirements 11.4
 */
export function clampAnimationDuration(
  durationSeconds: number,
  isMobile: boolean
): number {
  const safe = Math.max(0, durationSeconds);
  if (!isMobile) return safe;
  return Math.min(safe, MOBILE_MAX_ANIMATION_DURATION);
}
