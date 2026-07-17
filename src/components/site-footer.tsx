import Link from "next/link";
import { Phone, Mail, MapPin, Star, Clock, Globe } from "lucide-react";
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
  { href: "https://example.com", label: "About Us" },
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
        <div className="mt-10 flex flex-col items-center justify-center gap-6 border-t border-white/10 pt-6 text-sm text-slate-400">
          <div className="flex gap-6">
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Facebook">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.469 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Twitter">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://maps.app.goo.gl/DDS6skBgYzMTpU916?g_st=ic" target="_blank" rel="noopener noreferrer" className="hover:text-white" title="Google Business Profile" aria-label="Google Business Profile"><Globe className="size-5" /></a>
          </div>

          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6 text-center">
            <span>© {tradingName}. All rights reserved.</span>
            <ul className="flex flex-wrap justify-center gap-4 md:gap-6">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
