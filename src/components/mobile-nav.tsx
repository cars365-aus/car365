"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_BODY_TYPES, BODY_TYPE_LABELS, BUDGET_BANDS, bodyTypeHref, budgetHref, makeHref } from "@/lib/nav";
import type { Make } from "@/lib/domain";

const PRIMARY = [
  { href: "/used-cars", label: "Buy Cars" },
  { href: "/sell-your-car", label: "Sell Your Car" },
  { href: "/finance", label: "Finance" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ makes, phone }: { makes: Make[]; phone: string | null }) {
  const [open, setOpen] = useState(false);
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 8);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex size-11 items-center justify-center rounded-lg text-foreground lg:hidden"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] max-w-sm overflow-y-auto p-0">
        <SheetTitle className="border-b border-border p-4 text-lg">Menu</SheetTitle>
        <nav className="flex flex-col p-2" onClick={() => setOpen(false)}>
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              {item.label}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}

          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular makes</p>
          <div className="grid grid-cols-2 gap-1">
            {popularMakes.map((m) => (
              <Link key={m.slug} href={makeHref(m.slug)} className="rounded-lg px-3 py-2 text-sm text-body hover:bg-muted">
                {m.name}
              </Link>
            ))}
          </div>

          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By body type</p>
          <div className="grid grid-cols-2 gap-1">
            {NAV_BODY_TYPES.map((b) => (
              <Link key={b} href={bodyTypeHref(b)} className="rounded-lg px-3 py-2 text-sm text-body hover:bg-muted">
                {BODY_TYPE_LABELS[b]}
              </Link>
            ))}
          </div>

          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By budget</p>
          <div className="grid grid-cols-2 gap-1">
            {BUDGET_BANDS.map((b) => (
              <Link key={b.max} href={budgetHref(b.max)} className="rounded-lg px-3 py-2 text-sm text-body hover:bg-muted">
                {b.label}
              </Link>
            ))}
          </div>
        </nav>

        {phone ? (
          <div className="sticky bottom-0 border-t border-border bg-card p-4">
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              <Phone className="size-5" /> Call {phone}
            </a>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
