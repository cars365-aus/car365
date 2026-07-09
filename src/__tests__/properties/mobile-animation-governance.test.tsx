// Feature: mobile-optimisation, Task 12.1: Mobile animation constraints

/**
 * Unit tests for mobile animation governance.
 *
 * Covers:
 *  - clampAnimationDuration caps mobile durations at 300ms (Req 11.4)
 *  - MobileAnimationProvider limits concurrent animations to 3 on mobile (Req 11.3)
 *  - reduced-motion preference is surfaced through the context (Req 11.2)
 *  - desktop viewports are not concurrency-capped
 */

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  MobileAnimationProvider,
  useMobileAnimation,
  clampAnimationDuration,
  MAX_CONCURRENT_MOBILE_ANIMATIONS,
  MOBILE_MAX_ANIMATION_DURATION,
} from "@/components/mobile-animation-provider";

/**
 * Install a matchMedia mock. `mobile` controls whether the mobile-width query
 * matches; `reducedMotion` controls the reduced-motion query.
 */
function installMatchMedia(opts: { mobile: boolean; reducedMotion: boolean }) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const matches = query.includes("max-width")
      ? opts.mobile
      : query.includes("prefers-reduced-motion")
        ? opts.reducedMotion
        : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.add(cb),
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.delete(cb),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
}

describe("clampAnimationDuration (Req 11.4)", () => {
  it("passes desktop durations through unchanged", () => {
    expect(clampAnimationDuration(0.8, false)).toBe(0.8);
    expect(clampAnimationDuration(0.6, false)).toBe(0.6);
    expect(clampAnimationDuration(0.1, false)).toBe(0.1);
  });

  it("caps mobile durations at 300ms", () => {
    expect(clampAnimationDuration(0.8, true)).toBe(MOBILE_MAX_ANIMATION_DURATION);
    expect(clampAnimationDuration(0.6, true)).toBe(MOBILE_MAX_ANIMATION_DURATION);
    expect(clampAnimationDuration(0.3, true)).toBe(0.3);
  });

  it("does not raise durations already below the mobile cap", () => {
    expect(clampAnimationDuration(0.2, true)).toBe(0.2);
  });

  it("floors negative durations at 0", () => {
    expect(clampAnimationDuration(-1, true)).toBe(0);
    expect(clampAnimationDuration(-1, false)).toBe(0);
  });
});

describe("MobileAnimationProvider concurrency governance (Req 11.3)", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("limits concurrent animations to 3 on mobile", () => {
    installMatchMedia({ mobile: true, reducedMotion: false });

    const { result } = renderHook(() => useMobileAnimation(), {
      wrapper: MobileAnimationProvider,
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.maxConcurrent).toBe(MAX_CONCURRENT_MOBILE_ANIMATIONS);

    // First three acquisitions succeed.
    act(() => {
      expect(result.current.acquireSlot()).toBe(true);
      expect(result.current.acquireSlot()).toBe(true);
      expect(result.current.acquireSlot()).toBe(true);
    });

    // The fourth is rejected — the cap has been reached.
    act(() => {
      expect(result.current.acquireSlot()).toBe(false);
    });

    // Releasing one frees a slot for the next acquisition.
    act(() => {
      result.current.releaseSlot();
      expect(result.current.acquireSlot()).toBe(true);
      expect(result.current.acquireSlot()).toBe(false);
    });
  });

  it("does not cap concurrency on desktop viewports", () => {
    installMatchMedia({ mobile: false, reducedMotion: false });

    const { result } = renderHook(() => useMobileAnimation(), {
      wrapper: MobileAnimationProvider,
    });

    expect(result.current.isMobile).toBe(false);

    act(() => {
      for (let i = 0; i < 20; i++) {
        expect(result.current.acquireSlot()).toBe(true);
      }
    });
  });

  it("surfaces the reduced-motion preference (Req 11.2)", () => {
    installMatchMedia({ mobile: true, reducedMotion: true });

    const { result } = renderHook(() => useMobileAnimation(), {
      wrapper: MobileAnimationProvider,
    });

    expect(result.current.prefersReducedMotion).toBe(true);
  });
});

describe("useMobileAnimation default (outside a provider)", () => {
  it("degrades gracefully to always-animate", () => {
    const { result } = renderHook(() => useMobileAnimation());
    expect(result.current.acquireSlot()).toBe(true);
    expect(result.current.prefersReducedMotion).toBe(false);
    // releaseSlot must be a no-op that does not throw.
    expect(() => result.current.releaseSlot()).not.toThrow();
  });
});
