"use client";

import { motion, Variants, useInView } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  useMobileAnimation,
  clampAnimationDuration,
} from "@/components/mobile-animation-provider";

interface MotionScrollProps {
  children: ReactNode;
  className?: string;
  variant?: "fade-up" | "scale-in" | "stagger-container" | "stagger-item";
  delay?: number;
}

const EASE = [0.16, 1, 0.3, 1] as const; // Custom snappy easing

/**
 * Scroll-triggered reveal wrapper.
 *
 * Animation governance (mobile):
 *  - uses only GPU-accelerated properties (transform/opacity) — Req 11.1
 *  - disables animation entirely when reduced motion is preferred — Req 11.2
 *  - limits concurrent animating elements to 3 on mobile during scroll — Req 11.3
 *  - clamps animation duration to ≤300ms on mobile — Req 11.4
 *  - applies `will-change` only for the duration of the animation — Req 11.5
 *
 * @validates Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export function MotionScroll({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
}: MotionScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const { prefersReducedMotion, isMobile, acquireSlot, releaseSlot } =
    useMobileAnimation();

  // Whether this element has been granted an animation slot.
  // null = undecided, true = animate, false = render final state instantly.
  const [granted, setGranted] = useState<boolean | null>(null);
  const [willChange, setWillChange] = useState(false);

  useEffect(() => {
    if (!inView || granted !== null) return;

    requestAnimationFrame(() => {
      // Reduced motion: never animate, jump straight to the visible state.
      if (prefersReducedMotion) {
        setGranted(false);
        return;
      }

      // Concurrency governance: only animate if a slot is available.
      const ok = acquireSlot();
      setGranted(ok);
      if (ok) {
        setWillChange(true);
      }
    });
    // When not granted we never acquired a slot, so there is nothing to release.
  }, [inView, granted, prefersReducedMotion, acquireSlot]);

  // The animation should actually "play" (transition) only when granted.
  const shouldPlay = inView && granted === true;
  // When in view but not granted (reduced motion or cap reached), show the
  // final visible state with no transition.
  const instant = prefersReducedMotion || granted === false;

  // Stay hidden until a decision has been made to avoid a premature animation
  // or a flash of unstyled content. Reduced-motion users start visible.
  const animate =
    prefersReducedMotion || (inView && granted !== null) ? "visible" : "hidden";

  const duration = clampAnimationDuration(0.8, isMobile);
  const itemDuration = clampAnimationDuration(0.6, isMobile);
  const staggerDelay = isMobile ? 0.08 : 0.15;

  const baseTransition = instant
    ? { duration: 0 }
    : { duration, ease: EASE, delay };

  const itemTransition = instant
    ? { duration: 0 }
    : { duration: itemDuration, ease: EASE };

  const variants: Record<string, Variants> = {
    "fade-up": {
      hidden: { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0, transition: baseTransition },
    },
    "scale-in": {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: baseTransition },
    },
    "stagger-container": {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: instant
          ? { duration: 0 }
          : { staggerChildren: staggerDelay, delayChildren: delay },
      },
    },
    "stagger-item": {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: itemTransition },
    },
  };

  const handleAnimationComplete = () => {
    // Remove the will-change hint and release the concurrency slot once the
    // animation has finished (Req 11.3, 11.5).
    if (willChange) {
      setWillChange(false);
    }
    if (shouldPlay) {
      releaseSlot();
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants[variant]}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      animate={animate}
      onAnimationComplete={handleAnimationComplete}
      style={willChange ? { willChange: "transform, opacity" } : undefined}
    >
      {children}
    </motion.div>
  );
}
