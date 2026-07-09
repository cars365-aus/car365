"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useMobileState } from "@/components/mobile-state-provider";

interface WhatsAppFloatProps {
  /** Platform support WhatsApp number */
  phone?: string;

  stickyCtaVisible?: boolean;
  /** When true, hide the button entirely (e.g. modal or mobile nav is open) */
  hidden?: boolean;
}

// Routes where the floating support button should NOT appear
const HIDDEN_PREFIXES = ["/vendor", "/admin", "/auth", "/customer"];

/**
 * A floating WhatsApp support button shown on public-facing pages only.
 * Lets any visitor reach the Hire Car support team directly.
 *
 * Context-aware positioning:
 * - Repositions above the sticky CTA bar on mobile when visible
 * - Hides entirely when modals or mobile nav are open
 * - Respects safe area insets on modern devices
 */
export function WhatsAppFloat({
  phone = "61434930437",
  stickyCtaVisible = false,
  hidden = false,
}: WhatsAppFloatProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { isStickyCtaVisible, isMobileNavOpen, isModalOpen } = useMobileState();

  // Hide on certain routes
  const routeHidden = HIDDEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  // Hide inside specific chat rooms to prevent covering the input box
  const isChatRoom = pathname?.startsWith("/messages/") && pathname.length > 10;

  if (routeHidden || isChatRoom) return null;

  // Hide when modals or mobile nav are open or explicitly dismissed
  const isEffectivelyHidden = hidden || isMobileNavOpen || isModalOpen || isDismissed;
  if (isEffectivelyHidden) return null;

  // Lift the WhatsApp button above the sticky CTA bar on vehicle details
  const effectivelySticky = stickyCtaVisible || isStickyCtaVisible;

  const url = buildWhatsAppUrl(
    phone,
    "Hi Hire Car team, I have a question about renting a vehicle."
  );

  return (
    <div
      className={[
        "fixed right-4 sm:right-6 z-[var(--z-whatsapp)] group",
        effectivelySticky
          ? "bottom-28 lg:bottom-8"
          : "bottom-6 lg:bottom-8"
      ].join(" ")}
    >
      {/* Dismiss Button - Absolute top right */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          setIsDismissed(true);
        }}
        className="absolute -top-2 -right-2 z-10 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-full h-6 w-6 flex items-center justify-center shadow-md border border-slate-200 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
        aria-label="Close WhatsApp chat"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Chat with us on WhatsApp"
        className="flex items-center justify-center rounded-full bg-[#25D366] p-3.5 sm:pl-4 sm:pr-5 sm:py-3.5 text-white font-bold shadow-2xl shadow-emerald-600/30 hover:bg-[#1ebe5d] hover:scale-105 transition-all"
      >
        <svg
          className="h-6 w-6 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 sm:ml-3 ${hovered ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0 sm:max-w-[140px] sm:opacity-100"}`}
        >
          Chat with us
        </span>
      </a>
    </div>
  );
}
