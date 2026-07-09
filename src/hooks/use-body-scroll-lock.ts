import { useEffect, useRef } from "react";

/**
 * Locks/unlocks body scroll when `isLocked` is true.
 * Handles iOS scroll position preservation by saving scrollY,
 * applying position fixed, and restoring on unlock.
 * Cleans up on unmount.
 *
 * @validates Requirements 3.3
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isLocked) return;

    const body = document.body;
    const scrollY = window.scrollY;
    scrollYRef.current = scrollY;

    // Save current overflow and position styles
    const originalOverflow = body.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;

    // Lock scroll — iOS-safe approach using position fixed
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      // Restore original styles
      body.style.overflow = originalOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;

      // Restore scroll position
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isLocked]);
}
