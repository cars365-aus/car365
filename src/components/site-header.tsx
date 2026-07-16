import Link from "next/link";
import { Phone, ChevronDown } from "lucide-react";
import { getMakes } from "@/lib/data/inventory";
import { getPhoneNumbers } from "@/lib/data/settings";
import { MobileNav } from "@/components/mobile-nav";
import {
  NAV_BODY_TYPES,
  BODY_TYPE_LABELS,
  BUDGET_BANDS,
  bodyTypeHref,
  budgetHref,
  makeHref,
} from "@/lib/nav";

const PRIMARY = [
  { href: "/sell-your-car", label: "Sell Your Car" },
  { href: "/finance", label: "Finance" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Brand wordmark. Swap for a logo asset when supplied. */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-foreground">
      <img src="/LOGO.png" alt="Cars365" className="h-10 w-auto object-contain" />
    </Link>
  );
}

export async function SiteHeader() {
  const [makes, phones] = await Promise.all([getMakes(), getPhoneNumbers()]);
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 8);
  const phone = phones.primary || null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {/* Buy Cars mega-menu (CSS hover + focus-within) */}
          <div className="group relative">
            <Link
              href="/used-cars"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Buy Cars <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-0 top-full z-50 w-[560px] translate-y-1 rounded-xl border border-border bg-card p-5 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular makes</p>
                  <ul className="space-y-1">
                    {popularMakes.map((m) => (
                      <li key={m.slug}>
                        <Link href={makeHref(m.slug)} className="block rounded px-2 py-1 text-sm text-body hover:bg-muted hover:text-foreground">{m.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body type</p>
                  <ul className="space-y-1">
                    {NAV_BODY_TYPES.map((b) => (
                      <li key={b}>
                        <Link href={bodyTypeHref(b)} className="block rounded px-2 py-1 text-sm text-body hover:bg-muted hover:text-foreground">{BODY_TYPE_LABELS[b]}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By budget</p>
                  <ul className="space-y-1">
                    {BUDGET_BANDS.map((b) => (
                      <li key={b.max}>
                        <Link href={budgetHref(b.max)} className="block rounded px-2 py-1 text-sm text-body hover:bg-muted hover:text-foreground">{b.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:inline-flex"
            >
              <Phone className="size-4" /> {phone}
            </a>
          ) : (
            <Link
              href="/contact"
              className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:inline-flex"
            >
              <Phone className="size-4" /> Contact
            </Link>
          )}
          <MobileNav makes={makes} phone={phone} />
        </div>
      </div>
    </header>
  );
}
