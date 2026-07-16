import Link from "next/link";
import { Phone, Mail, MapPin, Star, Clock } from "lucide-react";
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
  { href: "/about", label: "About Us" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms & Conditions" },
];

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

export async function SiteFooter() {
  const [makes, phones, company, locations] = await Promise.all([
    getMakes(),
    getPhoneNumbers(),
    getCompanyProfile(),
    getActiveLocations(),
  ]);
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 8);
  const phone = phones.primary || null;
  const email = (company.email as string) || null;
  const rating = company.google_rating as number | undefined;
  const reviewCount = company.google_review_count as number | undefined;
  const tradingName = (company.trading_name as string) || "Cars365";
  const branch = locations[0] ?? null;

  return (
    <footer className="border-t border-white/10 bg-black text-slate-300 pt-10 pb-24 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Link hubs */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:grid-cols-7">
          <div className="col-span-2 xl:col-span-2">
            <Link href="/" className="block">
              <img src="/LOGO.png" alt="Cars365" className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              Quality used cars, honestly inspected and backed by a team that answers fast.
            </p>
            {rating ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-card/5 px-3 py-2 text-sm">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-semibold text-white">{rating}</span>
                {reviewCount ? <span className="text-slate-400">({reviewCount} Google reviews)</span> : null}
              </div>
            ) : null}
            <div className="mt-4 space-y-2 text-sm">
              {phone ? (
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4" />{phone}</a>
              ) : null}
              {email ? (
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-white"><Mail className="size-4" />{email}</a>
              ) : null}
              <a 
                href="https://maps.app.goo.gl/DDS6skBgYzMTpU916?g_st=ic" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 hover:text-white"
              >
                <MapPin className="size-4 shrink-0" />
                <span>Cars 365, Granville NSW</span>
              </a>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <iframe
                title="Cars 365 Location"
                src="https://maps.google.com/maps?q=Cars%20365,%20Granville,%20NSW&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="160"
                style={{ border: 0, filter: "grayscale(20%)" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Browse by make</h3>
            <ul className="space-y-2 text-sm">
              {popularMakes.map((m) => (
                <li key={m.slug}><Link href={makeHref(m.slug)} className="hover:text-white">{m.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">By body type</h3>
            <ul className="space-y-2 text-sm">
              {NAV_BODY_TYPES.slice(0, 6).map((b) => (
                <li key={b}><Link href={bodyTypeHref(b)} className="hover:text-white">{BODY_TYPE_LABELS[b]}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">By budget</h3>
            <ul className="space-y-2 text-sm">
              {BUDGET_BANDS.map((b) => (
                <li key={b.max}><Link href={budgetHref(b.max)} className="hover:text-white">{b.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          
          {branch && Object.keys(branch.hours).length > 0 ? (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Clock className="size-4" /> Opening hours
              </h3>
              <ul className="space-y-1 text-sm text-slate-400">
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].filter((d) => branch.hours[d]).map((d) => (
                  <li key={d} className="flex justify-between max-w-[160px]">
                    <span>{DAY_LABELS[d]}</span>
                    <span className="text-white">{branch.hours[d] === "closed" ? "Closed" : branch.hours[d]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Newsletter */}
        <div className="mt-10 rounded-xl border border-white/10 bg-card/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-white">New arrivals in your inbox</h3>
              <p className="text-sm text-slate-400">Be first to see cars that match what you&apos;re after.</p>
            </div>
            <div className="w-full max-w-md"><NewsletterForm /></div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" /> © {tradingName}. All rights reserved.
          </p>
          <ul className="flex gap-4">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
