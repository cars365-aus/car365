import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { VehicleCard } from "@/components/vehicle-card";
import { SearchWidget } from "@/components/search-widget";
import { LocationCard } from "@/components/location-card";
import { TrustSignals } from "@/components/trust-signals";
import { HowItWorks } from "@/components/how-it-works";
import { TestimonialCard } from "@/components/testimonial-card";
import { SiteFooter } from "@/components/site-footer";
import { getActiveFeaturedVehicles, getApprovedTestimonials, getMarketplaceStats } from "@/lib/data/featured";
import { searchVehicles } from "@/lib/search/typesense";
import { createAdminClient } from "@/lib/supabase/admin";
import { MotionScroll } from "@/components/motion-scroll";
import { Section } from "@/components/ui/section";
import { buildWebSiteSchema, buildBrandOrganizationSchema, serializeSchemas } from "@/lib/seo";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "HireCar Marketplace | Premium Car Rental",
  description: "Premium car rental. Without the premium price.",
};

export const revalidate = 3600;

// LCP hero background. Extracted to a constant so the same URL is used by both
// the <Image> element and the mobile <link rel="preload"> below, guaranteeing
// the preloaded resource matches what the browser actually fetches.
const HERO_IMAGE_SRC =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80";

// Build a Next.js image-optimizer URL for a given width (q=75 is the default
// allowed quality). Used to construct a responsive preload srcset for mobile.
const heroOptimisedUrl = (width: number) =>
  `/_next/image?url=${encodeURIComponent(HERO_IMAGE_SRC)}&w=${width}&q=75`;

const popularLocations = [
  { name: "Sydney", imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80", href: "/locations/sydney" },
  { name: "Melbourne", imageUrl: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=600&q=80", href: "/locations/melbourne" },
  { name: "Brisbane", imageUrl: "https://images.unsplash.com/photo-1554939437-ecc492c67b78?auto=format&fit=crop&w=600&q=80", href: "/locations/brisbane" },
  { name: "Perth", imageUrl: "/perth.png", href: "/locations/perth" },
  { name: "Adelaide", imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=600&q=80", href: "/locations/adelaide" },
  { name: "Gold Coast", imageUrl: "https://images.unsplash.com/photo-1535961652354-923cb08225a7?auto=format&fit=crop&w=600&q=80", href: "/locations/gold-coast" },
];

const browseCategories = [
  { name: "Sedan", href: "/categories/sedan" },
  { name: "SUV", href: "/categories/suv" },
  { name: "People mover", href: "/categories/people-mover" },
  { name: "Van", href: "/categories/van" },
  { name: "Ute", href: "/categories/ute" },
  { name: "Luxury", href: "/categories/luxury" },
];

export default async function Home() {
  const featuredFromDb = await getActiveFeaturedVehicles();
  // Real, moderation-approved customer reviews only. No fabricated testimonials.
  const testimonials = await getApprovedTestimonials(4);
  // Live, provable marketplace counts derived from approved records only.
  const stats = await getMarketplaceStats();
  const { vehicles: searchFallback } = await searchVehicles("", {}, { page: 1, perPage: 6 });
  const featuredVehicles = (
    featuredFromDb.length > 0 ? featuredFromDb : searchFallback
  ).slice(0, 6);

  // Fetch live vehicle counts and min prices per city
  const supabase = createAdminClient();
  const { data: cityStats } = await supabase
    .from("vehicles")
    .select("price_per_day_aud, branches!inner(city, status)")
    .eq("status", "approved")
    .eq("branches.status", "approved");

  const cityDataMap: Record<string, { count: number; minPrice: number }> = {};
  cityStats?.forEach((v) => {
    type BranchRecord = { city: string; status: string };
    const branch = v.branches as unknown as BranchRecord;
    if (branch?.city) {
      if (!cityDataMap[branch.city]) {
        cityDataMap[branch.city] = { count: 0, minPrice: v.price_per_day_aud };
      }
      cityDataMap[branch.city].count += 1;
      if (v.price_per_day_aud < cityDataMap[branch.city].minPrice) {
        cityDataMap[branch.city].minPrice = v.price_per_day_aud;
      }
    }
  });

  // Merge live data with location configs
  const locationsWithData = popularLocations.map((loc) => ({
    ...loc,
    vehicleCount: cityDataMap[loc.name]?.count ?? 0,
    startingPrice: cityDataMap[loc.name]?.minPrice ?? 0,
  }));

  // Build honest stat cards: numeric cards only when the count is provable
  // (> 0), padded with truthful qualitative claims about the platform model.
  // "$0 booking fees" reflects the actual no-marketplace-fee business model.
  const numericStats: { value: string; label: string }[] = [];
  if (stats.operatorCount > 0) {
    numericStats.push({ value: String(stats.operatorCount), label: stats.operatorCount === 1 ? "Verified operator" : "Verified operators" });
  }
  if (stats.cityCount > 0) {
    numericStats.push({ value: String(stats.cityCount), label: stats.cityCount === 1 ? "City covered" : "Cities covered" });
  }
  if (stats.vehicleCount > 0) {
    numericStats.push({ value: String(stats.vehicleCount), label: stats.vehicleCount === 1 ? "Vehicle listed" : "Vehicles listed" });
  }
  const qualitativeStats = [
    { value: "$0", label: "Booking fees" },
    { value: "100%", label: "Verified operators" },
    { value: "AU", label: "Australia-wide" },
  ];
  const heroStats = [...numericStats, ...qualitativeStats].slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-foreground font-sans overflow-x-hidden">
      {/*
        Preload the LCP hero image specifically for the Mobile_Viewport so it
        begins downloading from the document <head>, before it is discovered in
        the <body>. The media query scopes the preload to phones (≤767px), and
        the responsive imageSrcSet lets the browser pick the width that matches
        what next/image will request (Requirement 6.6).
      */}
      <link
        rel="preload"
        as="image"
        href={heroOptimisedUrl(1080)}
        imageSrcSet={`${heroOptimisedUrl(640)} 640w, ${heroOptimisedUrl(828)} 828w, ${heroOptimisedUrl(1080)} 1080w`}
        imageSizes="100vw"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas([buildWebSiteSchema(), buildBrandOrganizationSchema()]) }}
      />
      <SiteHeader />

      <main>
        {/* ===== 1. HERO SECTION ===== */}
        <section className="relative bg-white pb-0">
          <div className="relative overflow-hidden bg-slate-950 min-h-[520px] flex items-center">
            {/* Background car image */}
            <Image
              src={HERO_IMAGE_SRC}
              alt="Premium rental car"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              className="object-cover object-right opacity-90"
            />
            {/* Gradient overlays for depth + legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(234,88,12,0.18)_0%,_transparent_55%)]" />

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl pt-16 pb-24 lg:pt-20 lg:pb-32">
                <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black text-white tracking-tight leading-[1.05]">
                  Find the right vehicle,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fb923c] to-[#ea580c]">
                    direct from trusted operators.
                  </span>
                </h1>

                <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed">
                  Compare cars, vans, utes and luxury vehicles from verified Australian rental businesses. No marketplace fees, ever.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    href="/search"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#ea580c] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#f97316] transition-all shadow-xl shadow-[#ea580c]/30 hover:scale-[1.02]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Search Vehicles
                  </Link>
                  <Link
                    href="/for-vendors"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    List Your Fleet Free <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Inline mini trust row */}
                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Verified businesses</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No hidden fees</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Australia-wide</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Widget — overlapping the banner */}
          <div className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <SearchWidget variant="hero" />
          </div>
        </section>

        {/* ===== 2. TRUST SIGNALS ===== */}
        <TrustSignals />

        {/* ===== 3. HOW IT WORKS ===== */}
        <HowItWorks />

        {/* ===== 4. FEATURED VEHICLES ===== */}
        {featuredVehicles.length > 0 && (
          <Section variant="default" size="md" container>
            <MotionScroll variant="fade-up" className="mb-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Featured Vehicles
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Browse top-rated rentals available now
              </p>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((vehicle) => (
                <MotionScroll key={vehicle.id} variant="stagger-item">
                  <VehicleCard vehicle={vehicle} variant="featured" priority={false} />
                </MotionScroll>
              ))}
            </MotionScroll>

            <div className="mt-10 flex justify-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View All Vehicles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>
        )}

        {/* ===== 5. TESTIMONIALS (real approved reviews only) ===== */}
        {testimonials.length > 0 && (
          <Section variant="default" size="md" container>
            <MotionScroll variant="fade-up" className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                What Our Customers Say
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
                Verified reviews from renters across Australia
              </p>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <MotionScroll key={testimonial.id} variant="stagger-item">
                  <TestimonialCard
                    quote={testimonial.quote}
                    author={testimonial.author}
                    location={testimonial.location}
                    rating={testimonial.rating}
                  />
                </MotionScroll>
              ))}
            </MotionScroll>
          </Section>
        )}

        {/* ===== 6. POPULAR LOCATIONS ===== */}
        <Section variant="muted" size="md" container>
          <MotionScroll variant="fade-up" className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Popular Locations
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Explore car hire options across Australia
            </p>
          </MotionScroll>

          <MotionScroll variant="stagger-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationsWithData.map((location) => (
              <MotionScroll key={location.name} variant="stagger-item">
                <LocationCard
                  name={location.name}
                  imageUrl={location.imageUrl}
                  vehicleCount={location.vehicleCount}
                  startingPrice={location.startingPrice}
                  href={location.href}
                />
              </MotionScroll>
            ))}
          </MotionScroll>

          <div className="mt-10 flex justify-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-bold text-foreground hover:bg-accent transition-colors"
            >
              View All Locations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>

        {/* ===== 6b. BROWSE BY CATEGORY ===== */}
        <Section variant="default" size="md" container>
          <MotionScroll variant="fade-up" className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Find the right vehicle type for your trip
            </p>
          </MotionScroll>
          <div className="flex flex-wrap gap-3 justify-center">
            {browseCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </Section>

        {/* ===== 7. VENDOR CTA ===== */}
        <Section variant="navy" size="lg" container className="relative overflow-hidden">
          {/* Soft decorative glows using the premium blue accent */}
          <div className="pointer-events-none absolute top-10 right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 left-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Now accepting new operators</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Grow your rental business
              <br />
              <span className="text-primary">with qualified leads</span>
            </h2>

            <p className="text-lg md:text-xl text-slate-300 font-medium mb-10 max-w-lg leading-relaxed">
              List your fleet alongside verified operators across Australia — with zero booking fees.
            </p>

            {/* Benefit bullet points */}
            <ul className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                "Reach more customers Australia-wide",
                "Direct enquiries — no middleman fees",
                "Verified operator badge builds trust",
                "Analytics dashboard included",
              ].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-slate-200">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Primary CTA → vendor sign-up flow */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/auth/sign-in"
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                List Your Fleet Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="text-sm text-slate-400 font-medium">
                No credit card required · 2 min setup
              </span>
            </div>
          </div>
        </Section>

        {/* ===== ADDITIONAL SECTIONS (SEO & FAQ — not in spec order but add value) ===== */}

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-muted/50 border-t border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <MotionScroll variant="fade-up" className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about booking with HireCar Marketplace.
              </p>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="space-y-4">
              {[
                { q: "How do I book a vehicle?", a: "Search for your location and dates, select a vehicle, and send an enquiry directly to the local operator. They will confirm availability and terms with you." },
                { q: "Are there any hidden fees?", a: "No. The price you see includes all taxes and basic insurance. Operators may offer optional extras like child seats or GPS at the counter." },
                { q: "Can I cancel my reservation?", a: "Most operators offer free cancellation up to 48 hours before pickup. You can view the specific cancellation policy of any vehicle before booking." },
                { q: "Do I need a special license?", a: "A valid standard driver's license from your home country is required. International drivers may need an International Driving Permit (IDP)." },
              ].map((faq, index) => (
                <MotionScroll key={index} variant="stagger-item">
                  <details className="group bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-md transition-all">
                    <summary className="flex justify-between items-center font-bold text-lg text-foreground list-none">
                      {faq.q}
                      <span className="transition-transform duration-300 group-open:rotate-180 bg-muted p-2 rounded-full">
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="text-muted-foreground mt-4 leading-relaxed border-t border-border pt-4">
                      {faq.a}
                    </p>
                  </details>
                </MotionScroll>
              ))}
            </MotionScroll>
          </div>
        </section>

        {/* SEO Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80"
              alt="Australian road"
              fill
              loading="lazy"
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/85 to-[#0f172a]/70" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
                  Car Hire Across<br />Australia
                </h2>
                <div className="space-y-4 text-base text-slate-300 leading-relaxed">
                  <p>
                    HireCar Marketplace makes it easy to find the right vehicle from trusted rental operators across Australia. Compare options from verified businesses in one place.
                  </p>
                  <p>
                    We work with rental companies in all major cities. From small cars to large vans and utes, hire vehicles for business or personal use with confidence.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"].map((city) => (
                    <Link
                      key={city}
                      href={`/search?city=${city}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                      {city}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-6 text-center">
                      <p className={`text-3xl font-black ${stat.value === "$0" ? "text-[#ea580c]" : "text-white"}`}>{stat.value}</p>
                      <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
