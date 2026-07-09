import { useEffect, useState, type RefObject } from "react";

const FALLBACK_HEIGHT = 116;

/**
 * Measures a header element's height using ResizeObserver and syncs it
 * to the `--header-height` CSS variable on the document root.
 * Falls back to 116px if ResizeObserver is unavailable.
 *
 * @validates Requirements 14.1, 14.2, 14.3
 */
export function useHeaderHeight(headerRef: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(FALLBACK_HEIGHT);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    // Fallback if ResizeObserver is not supported
    if (typeof ResizeObserver === "undefined") {
      document.documentElement.style.setProperty(
        "--header-height",
        `${FALLBACK_HEIGHT}px`
      );
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = (entry.target as HTMLElement).offsetHeight;
        setHeight(newHeight);
        document.documentElement.style.setProperty(
          "--header-height",
          `${newHeight}px`
        );
      }
    });

    // Set initial value
    const initialHeight = element.offsetHeight;
    setHeight(initialHeight);
    document.documentElement.style.setProperty(
      "--header-height",
      `${initialHeight}px`
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [headerRef]);

  return height;
}
