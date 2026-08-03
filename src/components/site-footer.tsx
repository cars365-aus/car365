import Link from "next/link";
import { Phone, Mail, MapPin, Star, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { getMakes } from "@/lib/data/inventory";
import { getPhoneNumbers, getCompanyProfile } from "@/lib/data/settings";
import { getActiveLocations } from "@/lib/data/locations";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  NAV_BODY_TYPES,
  BODY_TYPE_LABELS,
  BUDGET_BANDS,
  bodyTypeHref,
  budgetHref,
  makeHref,
} from "@/lib/nav";

const COMPANY_LINKS = [
  { href: "/about",          label: "About Us" },
  { href: "/how-it-works",   label: "How It Works" },
  { href: "/sell-your-car",  label: "Sell Your Car" },
  { href: "/finance",        label: "Finance" },
  { href: "/testimonials",   label: "Testimonials" },
  { href: "/faqs",           label: "FAQs" },
  { href: "/contact",        label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms",          label: "Terms & Conditions" },
  { href: "/legal/disclaimer",     label: "Disclaimer" },
];

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

const DAYS_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function SiteFooter() {
  const [makes, phones, company, locations] = await Promise.all([
    getMakes(),
    getPhoneNumbers(),
    getCompanyProfile(),
    getActiveLocations(),
  ]);

  const popularMakes     = makes.filter((m) => m.isPopular).slice(0, 8);
  const phone            = phones.primary || null;
  const email            = (company.email as string) || null;
  const rating           = company.google_rating as number | undefined;
  const reviewCount      = company.google_review_count as number | undefined;
  const tradingName      = (company.trading_name as string) || "Cars365";
  const branch           = locations[0] ?? null;
  const currentYear      = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0a0a0f] text-slate-400">
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

      {/* ── Newsletter banner ──────────────────────────────────────── */}
      <div className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-yellow-500/5 to-transparent border border-yellow-400/20 px-6 py-8 md:px-10">
            {/* decorative glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                  Stay in the loop
                </p>
                <h3 className="font-heading text-xl font-bold text-white">
                  New arrivals straight to your inbox
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Be first to see freshly listed cars that match what you&apos;re after.
                </p>
              </div>
              <div className="w-full max-w-lg shrink-0">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main link columns ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7">

          {/* Brand column – spans 2 on xl */}
          <div className="col-span-2 xl:col-span-2">
            <Link href="/" className="inline-block" aria-label="Cars365 home">
              <img
                src="/LOGO.png"
                alt="Cars365 Australia"
                className="h-10 w-auto object-contain brightness-110"
              />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Quality used cars honestly inspected, fairly priced, and backed by a
              team that actually picks up the phone.
            </p>

            {/* Google rating pill */}
            {rating ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-sm">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-white">{rating}</span>
                {reviewCount ? (
                  <span className="text-slate-400 text-xs">
                    ({reviewCount.toLocaleString()} reviews)
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Contact details */}
            <ul className="mt-5 space-y-2.5 text-sm">
              {phone ? (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="group flex items-center gap-2.5 transition-colors hover:text-white"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 group-hover:bg-yellow-400/10 transition-colors">
                      <Phone className="size-3.5 text-yellow-400" />
                    </span>
                    <span>{phone}</span>
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="group flex items-center gap-2.5 transition-colors hover:text-white"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 group-hover:bg-yellow-400/10 transition-colors">
                      <Mail className="size-3.5 text-yellow-400" />
                    </span>
                    <span className="break-all">{email}</span>
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href="https://maps.app.goo.gl/DDS6skBgYzMTpU916?g_st=ic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 transition-colors hover:text-white"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 group-hover:bg-yellow-400/10 transition-colors">
                    <MapPin className="size-3.5 text-yellow-400" />
                  </span>
                  <span>Cars 365, Granville NSW</span>
                </a>
              </li>
            </ul>

            {/* Embedded map */}
            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              <iframe
                title="Cars 365 Location"
                src="https://maps.google.com/maps?q=Cars%20365,%20Granville,%20NSW&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="150"
                style={{ border: 0, display: "block", filter: "grayscale(30%) brightness(0.8) contrast(1.1)" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Browse by Make */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Browse by make
            </h3>
            <ul className="space-y-2.5 text-sm">
              {popularMakes.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={makeHref(m.slug)}
                    className="transition-colors hover:text-white"
                  >
                    {m.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/used-cars"
                  className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  All makes →
                </Link>
              </li>
            </ul>
          </div>

          {/* By body type */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Body type
            </h3>
            <ul className="space-y-2.5 text-sm">
              {NAV_BODY_TYPES.slice(0, 7).map((b) => (
                <li key={b}>
                  <Link
                    href={bodyTypeHref(b)}
                    className="transition-colors hover:text-white"
                  >
                    {BODY_TYPE_LABELS[b]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* By budget */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              By budget
            </h3>
            <ul className="space-y-2.5 text-sm">
              {BUDGET_BANDS.map((b) => (
                <li key={b.max}>
                  <Link
                    href={budgetHref(b.max)}
                    className="transition-colors hover:text-white"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Opening Hours */}
          {branch && Object.keys(branch.hours).length > 0 ? (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                <Clock className="size-3.5" />
                Hours
              </h3>
              <ul className="space-y-1.5 text-sm">
                {DAYS_ORDER.filter((d) => branch.hours[d]).map((d) => (
                  <li key={d} className="flex justify-between gap-4">
                    <span className="text-slate-500">{DAY_LABELS[d]}</span>
                    <span className={branch.hours[d] === "closed" ? "text-slate-600" : "text-white"}>
                      {branch.hours[d] === "closed" ? "Closed" : branch.hours[d]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
          {/* Copyright + legal */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 md:justify-start">
            <span>© {currentYear} {tradingName}. All rights reserved.</span>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-slate-300"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/marketplace/profile/1703029730/?tab=listings"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500 transition-all hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-400"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              <Youtube className="size-4" />
            </a>
            {/* X / Twitter */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
