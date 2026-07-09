"use client";

import { useRef, type ReactNode } from "react";
import { useScrollIndicator } from "@/hooks/use-scroll-indicator";

interface ScrollIndicatorProps {
  children: ReactNode;
  className?: string;
  /** Base color for the gradient fade (default: "white") */
  gradientColor?: string;
}

/**
 * Wraps children in a horizontally scrollable container with
 * leading/trailing gradient overlays that indicate more content.
 *
 * @validates Requirements 9.5, 16.1, 16.2, 16.3
 */
export function ScrollIndicator({
  children,
  className = "",
  gradientColor = "white",
}: ScrollIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showLeading, showTrailing } = useScrollIndicator(containerRef);

  return (
    <div className={`relative ${className}`}>
      {/* Leading gradient (left edge) */}
      {showLeading && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${gradientColor}, transparent)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-none"
      >
        {children}
      </div>

      {/* Trailing gradient (right edge) */}
      {showTrailing && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${gradientColor}, transparent)`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
