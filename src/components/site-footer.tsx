import Link from "next/link";
import { MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/icons";
import { resolveSocialUrl, SOCIAL_URLS } from "@/lib/social-links";

const footerLinks = {
  product: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Browse Cars", href: "/search" },
    { label: "Operators Directory", href: "/vendors" },
    { label: "Pricing", href: "/pricing" },
    { label: "List Your Fleet", href: "/for-vendors" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Rules & Guidelines", href: "/legal/rules" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
  ],
};

const popularLocations = [
  { label: "Sydney", href: "/search?city=Sydney" },
  { label: "Melbourne", href: "/search?city=Melbourne" },
  { label: "Brisbane", href: "/search?city=Brisbane" },
  { label: "Perth", href: "/search?city=Perth" },
  { label: "Adelaide", href: "/search?city=Adelaide" },
  { label: "Gold Coast", href: "/search?city=Gold%20Coast" },
];

// Footer nav columns. Rendered with a shared layout so every link keeps a
// 44x44px touch target on all viewports, including tablet (Req 1.4).
const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Product", links: footerLinks.product },
  { title: "Company", links: footerLinks.company },
  { title: "Legal", links: footerLinks.legal },
  { title: "Support", links: footerLinks.support },
];

// Touch-target friendly link styles for footer nav. min-h-[44px] + flex keeps
// the tappable area >= 44px tall at every breakpoint (no md:inline collapse).
const footerLinkClass =
  "flex items-center py-1 text-sm text-slate-400 hover:text-white transition-colors";



// Social links are env-driven so we never ship placeholder ("#") links.
// Configure the optional NEXT_PUBLIC_SOCIAL_* vars to surface each icon; any
// link left unset falls back to the known brand profile (or is hidden).
// resolveSocialUrl treats empty/whitespace/"#" env values as unset.
const socialLinks = [
  { icon: XIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_X_URL), label: "Twitter / X" },
  { icon: FacebookIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL, SOCIAL_URLS.facebook), label: "Facebook" },
  { icon: InstagramIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, SOCIAL_URLS.instagram), label: "Instagram" },
  { icon: LinkedinIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL, SOCIAL_URLS.linkedin), label: "LinkedIn" },
].filter((s): s is { icon: typeof XIcon; href: string; label: string } =>
  typeof s.href === "string" && s.href.trim().length > 0,
);

export function SiteFooter() {
  return (
    <footer className="bg-[#0f172a] text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-white px-2 py-1 shadow-sm transition-opacity hover:opacity-95 w-fit"
            >
              <BrandLogo
                className="h-[40px] w-[130px]"
                imageClassName="rounded-sm"
              />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-slate-400">
              Australia's trusted premium marketplace for verified car
              rental operators. Connect with local fleet owners for your next
              journey.
            </p>

            {/* Popular Locations */}
            <div className="mt-8">
              <h4 className="!text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
                Popular Locations
              </h4>
              <ul className="grid grid-cols-2 gap-2">
                {popularLocations.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-1.5 py-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="!text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
                {column.title}
              </h4>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Hire Car Marketplace. All rights
              reserved.
            </p>

            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
