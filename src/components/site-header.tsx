"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
// usePathname removed
import { Menu, ChevronDown, User, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { BrandLogo } from "@/components/brand-logo";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { MobileDrawerNav, DrawerSection } from "./mobile-drawer-nav";
import { PwaInstallMenuItem } from "@/components/pwa/pwa-install-menu-item";
import { useMobileState } from "@/components/mobile-state-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/icons";
import { resolveSocialUrl, SOCIAL_URLS } from "@/lib/social-links";

// Top-bar social icons. Env vars override the canonical fallback; a link that
// resolves to undefined (e.g. no X profile) is simply not rendered — never a
// dead "#" href. See resolveSocialUrl for placeholder handling.
const headerSocialLinks = [
  { icon: InstagramIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, SOCIAL_URLS.instagram), label: "Instagram" },
  { icon: FacebookIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL, SOCIAL_URLS.facebook), label: "Facebook" },
  { icon: XIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_X_URL), label: "Twitter" },
  { icon: LinkedinIcon, href: resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL, SOCIAL_URLS.linkedin), label: "LinkedIn" },
].filter((s): s is { icon: typeof XIcon; href: string; label: string } =>
  typeof s.href === "string" && s.href.trim().length > 0,
);

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isMobileNavOpen: isMobileMenuOpen, setIsMobileNavOpen: setIsMobileMenuOpen } = useMobileState();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  useHeaderHeight(headerRef);

  // pathname removed
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [profileHref, setProfileHref] = useState("/customer/dashboard");
  const [profileLabel, setProfileLabel] = useState("My Account");
  const [isVendor, setIsVendor] = useState(false);
  const [vendorUpgradeHref, setVendorUpgradeHref] = useState("/vendor/upgrade");
  const [listFleetLabel, setListFleetLabel] = useState("List Your Fleet");

  const locations = [
    { name: "Sydney", href: "/locations/sydney" },
    { name: "Melbourne", href: "/locations/melbourne" },
    { name: "Brisbane", href: "/locations/brisbane" },
    { name: "Perth", href: "/locations/perth" },
    { name: "Adelaide", href: "/locations/adelaide" },
    { name: "Gold Coast", href: "/locations/gold-coast" },
    { name: "Canberra", href: "/locations/canberra" },
    { name: "Hobart", href: "/locations/hobart" },
    { name: "Darwin", href: "/locations/darwin" },
    { name: "Cairns", href: "/locations/cairns" },
  ];

  const vehicleCategories = [
    { name: "Sedans", href: "/categories/sedan" },
    { name: "SUVs", href: "/categories/suv" },
    { name: "Utes & Trucks", href: "/categories/ute" },
    { name: "People Movers", href: "/categories/people-mover" },
    { name: "Luxury", href: "/categories/luxury" },
    { name: "Vans & Commercial", href: "/categories/van" },
    { name: "Electric & Hybrid", href: "/search?fuel=Electric" },
  ];

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Check auth state
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    
    const loadUserContext = async (hasSession: boolean) => {
      if (!hasSession) {
        setProfileHref("/customer/dashboard");
        setProfileLabel("My Account");
        setIsVendor(false);
        setVendorUpgradeHref("/vendor/upgrade");
        setListFleetLabel("List Your Fleet");
        return;
      }

      try {
        const res = await fetch("/api/user/context");
        if (res.ok) {
          const data = await res.json();
          setProfileHref(data.profileHref ?? "/customer/dashboard");
          setProfileLabel(data.profileLabel ?? "My Account");
          setIsVendor(!!data.isVendor);
          setVendorUpgradeHref(data.vendorUpgradeHref ?? "/vendor/upgrade");
          setListFleetLabel(data.listFleetLabel ?? "List Your Fleet");
        }
      } catch {
        setProfileHref("/customer/dashboard");
        setProfileLabel("My Account");
        setIsVendor(false);
        setVendorUpgradeHref("/vendor/upgrade");
        setListFleetLabel("List Your Fleet");
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      await loadUserContext(loggedIn);
      setIsLoadingAuth(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      await loadUserContext(loggedIn);
    });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Invisible spacer to push page content down, fixing overlap on all pages */}
      <div style={{ height: "var(--header-height, 116px)" }} className="w-full shrink-0" aria-hidden="true" />
      
      <header ref={headerRef} className="site-header-root fixed top-0 left-0 right-0 z-[var(--z-header,40)] flex flex-col pt-[env(safe-area-inset-top)]">
        {/* Vibrant Top Info Bar - Hides on scroll */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div 
              initial={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-orange-600 via-[#ea580c] to-amber-500 text-white text-xs font-bold tracking-wide py-2.5 px-4 flex justify-center sm:justify-between items-center shadow-inner"
            >
              <span className="hidden sm:inline-block">Australia&apos;s trusted premium car rental marketplace</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {headerSocialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-200 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
                <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Headphones className="h-3.5 w-3.5" /> <a href="tel:0434930437" className="hover:text-amber-100 transition-colors">0434 930 437</a>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Navbar */}
        <div
          className={`transition-all duration-300 w-full site-header-navbar ${
            isScrolled
              ? "bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-slate-100 py-1.5"
              : "bg-white border-b border-slate-100 py-2.5"
          }`}
        >
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              
              {/* HireCar Marketplace Logo */}
              <Link href="/" className="flex items-center gap-3.5 group hover:opacity-95 transition-opacity">
                <BrandLogo
                  priority
                  className="h-[48px] w-[180px] transition-transform duration-300 group-hover:scale-105 sm:h-[56px] sm:w-[220px]"
                  imageClassName="object-left mix-blend-multiply"
                />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8">
                {/* Dropdown 1 */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => setActiveDropdown("locations")}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center gap-1 font-bold text-sm text-slate-600 hover:text-[#ea580c] transition-colors py-2 group">
                    Locations 
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${activeDropdown === "locations" ? "rotate-180 text-primary" : "text-slate-400 group-hover:text-primary"}`} />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === "locations" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-[100%] left-0 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden py-3 border border-slate-100 origin-top-left"
                      >
                        {locations.map((loc) => (
                          <Link key={loc.name} href={loc.href} className="block px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-primary hover:translate-x-1 transition-all">
                            {loc.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dropdown 2 */}
                <div
                  className="relative h-full flex items-center"
                  onMouseEnter={() => setActiveDropdown("vehicles")}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center gap-1 font-bold text-sm text-slate-600 hover:text-primary transition-colors py-4 group">
                    Vehicles 
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${activeDropdown === "vehicles" ? "rotate-180 text-primary" : "text-slate-400 group-hover:text-primary"}`} />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === "vehicles" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-[100%] left-0 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden py-3 border border-slate-100 origin-top-left"
                      >
                        {vehicleCategories.map((cat) => (
                          <Link key={cat.name} href={cat.href} className="block px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-primary hover:translate-x-1 transition-all">
                            {cat.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/pricing" className="relative font-bold text-sm text-slate-600 hover:text-primary transition-colors group">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/for-vendors" className="relative font-bold text-sm text-slate-600 hover:text-primary transition-colors group">
                  Vendors
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/about" className="relative font-bold text-sm text-slate-600 hover:text-primary transition-colors group">
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/blog" className="relative font-bold text-sm text-slate-600 hover:text-primary transition-colors group">
                  Blog
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link href="/contact" className="relative font-bold text-sm text-slate-600 hover:text-primary transition-colors group">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
              </nav>

              {/* CTAs */}
              <div className="flex items-center gap-4">
                {isLoadingAuth ? (
                  <div className="hidden md:flex items-center gap-3">
                    <Skeleton className="h-11 w-32 rounded-full" />
                    <Skeleton className="h-11 w-36 rounded-full" />
                  </div>
                ) : (
                  isLoggedIn ? (
                    <div className="hidden md:flex items-center gap-3">
                      {isVendor ? (
                        <Link href="/customer/dashboard" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                          My Enquiries
                        </Link>
                      ) : (
                        <Link href={vendorUpgradeHref} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                          {listFleetLabel}
                        </Link>
                      )}
                      <Link href={profileHref} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ea580c] to-amber-500 hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-sm px-7 py-3 rounded-full transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5">
                        <User className="h-4 w-4" />
                        {profileLabel}
                      </Link>
                    </div>
                  ) : (
                    <Link href="/auth/sign-in" className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-7 py-3 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                      Log in / Sign up
                    </Link>
                  )
                )}

                {/* Mobile Toggle */}
                <button onClick={openMobileMenu} className="md:hidden flex h-11 w-11 items-center justify-center text-slate-700 hover:text-primary transition-colors bg-slate-100 rounded-full" aria-label="Open mobile menu">
                  <Menu className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileDrawerNav isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 pb-6 border-b border-slate-100">
            <BrandLogo
              priority
              className="h-[48px] w-[180px]"
              imageClassName="object-left mix-blend-multiply"
            />
          </Link>
          
          <Link href="/search" onClick={closeMobileMenu} className="mt-6 bg-gradient-to-r from-primary to-amber-500 text-white font-bold text-lg rounded-2xl px-6 py-4 text-center shadow-lg shadow-primary/20 flex items-center justify-center min-h-[56px] touch-target">
            Find a Car
          </Link>
          
          <div className="flex flex-col gap-2 mt-4">
            <DrawerSection title="Locations">
              <div className="flex flex-col gap-2">
                {locations.map((loc) => (
                  <Link key={loc.name} href={loc.href} onClick={closeMobileMenu} className="block py-3 px-2 text-base text-slate-600 min-h-[44px] touch-target">
                    {loc.name}
                  </Link>
                ))}
              </div>
            </DrawerSection>
            
            <DrawerSection title="Vehicles">
              <div className="flex flex-col gap-2">
                {vehicleCategories.map((cat) => (
                  <Link key={cat.name} href={cat.href} onClick={closeMobileMenu} className="block py-3 px-2 text-base text-slate-600 min-h-[44px] touch-target">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </DrawerSection>

            <Link href="/pricing" onClick={closeMobileMenu} className="font-bold text-lg text-slate-800 hover:text-primary transition-colors py-3 min-h-[44px] touch-target">Pricing</Link>
            <Link href="/for-vendors" onClick={closeMobileMenu} className="font-bold text-lg text-slate-800 hover:text-primary transition-colors py-3 min-h-[44px] touch-target">Vendors</Link>
            <Link href="/about" onClick={closeMobileMenu} className="font-bold text-lg text-slate-800 hover:text-primary transition-colors py-3 min-h-[44px] touch-target">About</Link>
            <Link href="/blog" onClick={closeMobileMenu} className="font-bold text-lg text-slate-800 hover:text-primary transition-colors py-3 min-h-[44px] touch-target">Blog</Link>
            <Link href="/contact" onClick={closeMobileMenu} className="font-bold text-lg text-slate-800 hover:text-primary transition-colors py-3 min-h-[44px] touch-target">Contact</Link>
          </div>
          
          <div className="mt-6 flex flex-col pt-6 border-t border-slate-100 gap-3">
            {isLoadingAuth ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : (
              isLoggedIn ? (
                <>
                  {isVendor ? (
                    <Link href="/customer/dashboard" onClick={closeMobileMenu} className="font-bold text-base text-center bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 min-h-[48px] touch-target">
                      My Enquiries
                    </Link>
                  ) : (
                    <Link href={vendorUpgradeHref} onClick={closeMobileMenu} className="font-bold text-base text-center bg-white border border-orange-200 text-orange-700 rounded-2xl py-3 hover:bg-orange-50 transition-colors flex justify-center items-center gap-2 min-h-[48px] touch-target">
                      {listFleetLabel}
                    </Link>
                  )}
                  <Link href={profileHref} onClick={closeMobileMenu} className="font-bold text-base text-center bg-slate-100 text-slate-900 rounded-2xl py-3 hover:bg-slate-200 transition-colors flex justify-center items-center gap-2 min-h-[48px] touch-target">
                    <User className="h-5 w-5" /> {profileLabel}
                  </Link>
                </>
              ) : (
                <Link href="/auth/sign-in" onClick={closeMobileMenu} className="font-bold text-base text-center bg-slate-900 text-white rounded-2xl py-3 hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 min-h-[48px] touch-target">
                  Log in / Sign up
                </Link>
              )
            )}
          </div>

          {/* Install app (PWA) — adapts to platform / installed state */}
          <PwaInstallMenuItem />
        </div>
      </MobileDrawerNav>
    </>
  );
}
