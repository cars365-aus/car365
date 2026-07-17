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
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 6); // Limit to 6
  const phone = phones.primary || null;
  const email = (company.email as string) || null;
  const rating = company.google_rating as number | undefined;
  const reviewCount = company.google_review_count as number | undefined;
  const tradingName = (company.trading_name as string) || "Cars365";
  const branch = locations[0] ?? null;

  return (
    <footer className="bg-slate-950 text-slate-300">
      {/* Newsletter Section */}
      <div className="border-b border-white/5 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="font-heading text-2xl font-bold text-white mb-2">Join our VIP list</h3>
              <p className="text-slate-400">Get exclusive access to new arrivals, special offers, and automotive insights delivered straight to your inbox.</p>
            </div>
            <div className="w-full max-w-md"><NewsletterForm /></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link href="/" className="inline-block">
              <img src="/LOGO.png" alt="Cars365" className="h-12 w-auto object-contain" />
            </Link>
            <p className="max-w-sm text-sm text-slate-400 leading-relaxed">
              Premium used vehicles, meticulously inspected and ready for Sydney roads. We're redefining the car buying experience through transparency and trust.
            </p>
            
            {rating && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm w-fit">
                <Star className="size-4 fill-primary text-primary" />
                <span className="font-bold text-white">{rating}</span>
                {reviewCount && <span className="text-slate-400 font-medium">({reviewCount} reviews)</span>}
              </div>
            )}
            
            <div className="space-y-3 text-sm font-medium mt-2">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-white transition-colors">
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/5 text-primary"><Phone className="size-4" /></div>
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-white transition-colors">
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/5 text-primary"><Mail className="size-4" /></div>
                  {email}
                </a>
              )}
              <a href="https://maps.app.goo.gl/DDS6skBgYzMTpU916?g_st=ic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                <div className="flex size-8 items-center justify-center rounded-full bg-white/5 text-primary"><MapPin className="size-4 shrink-0" /></div>
                <span>Cars 365, Granville NSW</span>
              </a>
            </div>
          </div>

          {/* Quick Links Group */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-white tracking-wider uppercase text-xs mb-6">Inventory</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><Link href="/used-cars" className="text-slate-400 hover:text-primary transition-colors">All Vehicles</Link></li>
                {popularMakes.map((m) => (
                  <li key={m.slug}><Link href={makeHref(m.slug)} className="text-slate-400 hover:text-primary transition-colors">{m.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white tracking-wider uppercase text-xs mb-6">Company</h4>
              <ul className="space-y-3 text-sm font-medium">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-slate-400 hover:text-primary transition-colors">{l.label}</Link></li>
                ))}
                <li><Link href="/finance" className="text-slate-400 hover:text-primary transition-colors">Finance Options</Link></li>
                <li><Link href="/sell-your-car" className="text-slate-400 hover:text-primary transition-colors">Sell Your Car</Link></li>
              </ul>
            </div>
          </div>

          {/* Map & Hours Column */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="font-semibold text-white tracking-wider uppercase text-xs">Location & Hours</h4>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-inner">
              <iframe
                title="Cars 365 Location"
                src="https://maps.google.com/maps?q=Cars%20365,%20Granville,%20NSW&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="140"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
            
            {branch && Object.keys(branch.hours).length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <ul className="space-y-2 text-sm">
                  {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].filter((d) => branch.hours[d]).map((d) => (
                    <li key={d} className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">{DAY_LABELS[d]}</span>
                      <span className="text-white font-semibold">{branch.hours[d] === "closed" ? "Closed" : branch.hours[d]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row text-sm">
          
          {/* Left: Copyright */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-slate-500 font-medium">
              © {new Date().getFullYear()} {tradingName}. All rights reserved.
            </p>
          </div>

          {/* Center: Social Media */}
          <div className="flex flex-1 justify-center gap-4">
            <a href="#" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all" aria-label="Facebook">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all" aria-label="Instagram">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.469 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://maps.app.goo.gl/DDS6skBgYzMTpU916?g_st=ic" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all" aria-label="Google Business Profile"><Globe className="size-4" /></a>
          </div>
          
          {/* Right: Legal Links */}
          <div className="flex-1">
            <ul className="flex flex-wrap items-center justify-center md:justify-end gap-6 font-medium">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-slate-500 hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
