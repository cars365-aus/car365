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
    <a href="/" className="flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-foreground">
      <img src="/LOGO.png" alt="Cars365" className="h-10 w-auto object-contain" />
    </a>
  );
}

export async function SiteHeader() {
  const [makes, phones] = await Promise.all([getMakes(), getPhoneNumbers()]);
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 8);
  const phone = phones.primary || null;

  return (
    <header className="sticky top-0 z-50 w-full sm:py-4 transition-all duration-300">
      <div className="mx-auto flex h-16 sm:h-16 max-w-6xl items-center justify-between gap-4 border-b sm:border border-border/40 bg-background/80 sm:rounded-full px-4 sm:px-6 shadow-sm sm:shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {/* Buy Cars mega-menu (CSS hover + focus-within) */}
          <div className="group relative">
            <Link
              href="/used-cars"
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-all hover:bg-foreground/5 hover:text-foreground"
            >
              Buy Cars <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 w-[600px] -translate-x-1/2 translate-y-4 rounded-3xl border border-border/50 bg-background/95 p-8 opacity-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-2 group-focus-within:opacity-100">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Popular makes</p>
                  <ul className="space-y-1">
                    {popularMakes.map((m) => (
                      <li key={m.slug}>
                        <Link href={makeHref(m.slug)} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground">{m.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Body type</p>
                  <ul className="space-y-1">
                    {NAV_BODY_TYPES.map((b) => (
                      <li key={b}>
                        <Link href={bodyTypeHref(b)} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground">{BODY_TYPE_LABELS[b]}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">By budget</p>
                  <ul className="space-y-1">
                    {BUDGET_BANDS.map((b) => (
                      <li key={b.max}>
                        <Link href={budgetHref(b.max)} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground">{b.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className="relative rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-all hover:bg-foreground/5 hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary-hover hover:shadow-primary/30 sm:inline-flex"
            >
              <Phone className="size-4" /> {phone}
            </a>
          ) : (
            <Link
              href="/contact"
              className="hidden items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary-hover hover:shadow-primary/30 sm:inline-flex"
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
