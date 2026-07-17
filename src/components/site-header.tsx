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
  { href: "/blog", label: "Blog" },
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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg border-b border-blue-400/30 transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8">
        <Wordmark />

        <nav className="hidden items-center gap-6 lg:flex">
          {/* Buy Cars mega-menu (CSS hover + focus-within) */}
          <div className="group relative">
            <Link
              href="/used-cars"
              className="inline-flex items-center gap-1.5 py-2 text-[15px] font-medium text-white/90 transition-all hover:text-white"
            >
              Buy Cars <ChevronDown className="size-4 text-white/70 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 w-[600px] -translate-x-1/2 translate-y-4 rounded-xl border border-border/50 bg-white p-8 opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Popular makes</p>
                  <ul className="space-y-1">
                    {popularMakes.map((m) => (
                      <li key={m.slug}>
                        <Link href={makeHref(m.slug)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">{m.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Body type</p>
                  <ul className="space-y-1">
                    {NAV_BODY_TYPES.map((b) => (
                      <li key={b}>
                        <Link href={bodyTypeHref(b)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">{BODY_TYPE_LABELS[b]}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">By budget</p>
                  <ul className="space-y-1">
                    {BUDGET_BANDS.map((b) => (
                      <li key={b.max}>
                        <Link href={budgetHref(b.max)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">{b.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className="text-[15px] font-medium text-white/90 transition-all hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {phone && (
            <a href={`tel:${phone}`} className="hidden items-center gap-2 text-[15px] font-semibold text-white hover:opacity-80 transition-opacity lg:flex">
              <Phone className="size-4 text-white" /> {phone}
            </a>
          )}
          <Link
            href="/sell-your-car"
            className="hidden items-center justify-center rounded-full bg-white px-7 py-2.5 text-[15px] font-bold text-blue-600 shadow-sm transition-all hover:scale-105 hover:shadow-md sm:inline-flex"
          >
            Sell Your Car
          </Link>
          <MobileNav makes={makes} phone={phone} />
        </div>
      </div>
    </header>
  );
}
