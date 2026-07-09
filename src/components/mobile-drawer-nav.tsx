"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";

interface MobileDrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Right-sliding mobile navigation drawer with backdrop, focus trap,
 * swipe-to-close gesture, and body scroll lock.
 *
 * @validates Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.4, 5.5, 12.2
 */
export function MobileDrawerNav({ isOpen, onClose, children }: MobileDrawerNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);

  // Lock body scroll when open
  useBodyScrollLock(isOpen);

  // Swipe left on panel to close
  useSwipeGesture(panelRef, {
    threshold: 50,
    onSwipeLeft: onClose,
  });

  // Focus trap: cycle tab within drawer, Escape closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusableElements = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), details, summary'
        );

        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  // Set up keydown listener and focus management
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);

      // Focus first focusable element when drawer opens
      requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const firstFocusable = panel.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), details, summary'
        );
        if (firstFocusable) {
          firstFocusable.focus();
          firstFocusableRef.current = firstFocusable;
        }
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[60] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Semi-transparent backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 h-[100dvh] w-[85vw] max-w-sm bg-white shadow-xl
          transform transition-transform duration-[250ms] ease-out will-change-transform
          overflow-y-auto overscroll-contain
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close button */}
        <div className="flex items-center justify-end p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="touch-target flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation content with expandable sections */}
        <nav className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </nav>
      </div>
    </div>
  );
}

/**
 * Expandable section using native <details>/<summary> for locations and categories.
 */
export function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-gray-100">
      <summary className="flex cursor-pointer items-center justify-between py-3 text-base font-medium text-gray-900 min-h-[44px] list-none [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="pb-3 pl-2">{children}</div>
    </details>
  );
}
