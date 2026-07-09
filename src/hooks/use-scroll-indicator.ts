import { useEffect, useState, useCallback, type RefObject } from "react";

export interface ScrollIndicatorState {
  showLeading: boolean;
  showTrailing: boolean;
}

/**
 * Tracks horizontal scroll position of a container and returns whether
 * leading/trailing gradient indicators should be visible.
 *
 * Leading is visible when scrollLeft > 0.
 * Trailing is visible when scrollLeft + clientWidth < scrollWidth.
 *
 * @validates Requirements 16.1, 16.2, 16.3
 */
export function useScrollIndicator(
  containerRef: RefObject<HTMLElement | null>
): ScrollIndicatorState {
  const [state, setState] = useState<ScrollIndicatorState>({
    showLeading: false,
    showTrailing: false,
  });

  const updateIndicators = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setState({
      showLeading: scrollLeft > 0,
      showTrailing: Math.ceil(scrollLeft + clientWidth) < scrollWidth,
    });
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial check
    updateIndicators();

    el.addEventListener("scroll", updateIndicators, { passive: true });

    // Also observe resize in case container changes size
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateIndicators);
      observer.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", updateIndicators);
      observer?.disconnect();
    };
  }, [containerRef, updateIndicators]);

  return state;
}
