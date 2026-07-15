import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, BadgeCheck, Handshake, CircleDollarSign, ArrowRight, Star,
  Search, Car, Phone,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { HeroSearch } from "@/components/hero-search";
import { getFeaturedVehicles, getMakes } from "@/lib/data/inventory";
import { getApprovedTestimonials } from "@/lib/data/content";
import { getCompanyProfile } from "@/lib/data/settings";
import {
  NAV_BODY_TYPES, BODY_TYPE_LABELS, BUDGET_BANDS,
  bodyTypeHref, budgetHref, makeHref,
} from "@/lib/nav";
import { HeroParallax, FadeInStagger, FadeInItem } from "@/components/animations/hero-animations";
import { ScrollReveal } from "@/components/animations/scroll-reveal";

export const metadata: Metadata = {
  title: "Car365 — Quality Used Cars, Honestly Inspected",
  description: "Browse quality, inspected used cars for sale. Transparent pricing, finance available, trade-ins welcome, and a team that answers fast.",
};

export const revalidate = 900;

const TRUST = [
  { icon: ShieldCheck, title: "Every car inspected", body: "Multi-point inspection before it's listed." },
  { icon: BadgeCheck, title: "Roadworthy included", body: "Ready to drive away with paperwork sorted." },
  { icon: CircleDollarSign, title: "Finance available", body: "We'll help arrange competitive repayments." },
  { icon: Handshake, title: "Trade-ins welcome", body: "Fair offers on your current car." },
];

const STEPS = [
  { icon: Search, title: "Browse & shortlist", body: "Filter our inventory to find cars that fit your needs and budget." },
  { icon: Phone, title: "Enquire in seconds", body: "Call, WhatsApp or send a quick enquiry — a specialist replies fast." },
  { icon: Car, title: "Inspect & drive away", body: "Book a viewing, arrange finance, and drive home with confidence." },
];

export default async function HomePage() {
  const [featured, makes, testimonials, company] = await Promise.all([
    getFeaturedVehicles(8),
    getMakes(),
    getApprovedTestimonials(6),
    getCompanyProfile(),
  ]);
  const popularMakes = makes.filter((m) => m.isPopular).slice(0, 8);
  const rating = company.google_rating as number | undefined;

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <HeroParallax imageUrl="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=2000&q=80">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 relative z-10">
            <div className="max-w-2xl">
              <FadeInStagger>
                {rating ? (
                  <FadeInItem>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-4 py-2 text-sm">
                      <Star className="size-4 fill-primary text-primary" />
                      <span className="font-bold text-white">{rating}</span> rated by our customers
                    </div>
                  </FadeInItem>
                ) : null}
                <FadeInItem>
                  <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
                    Dream it.<br/>Drive it.<br/>Discover it.
                  </h1>
                </FadeInItem>
                <FadeInItem>
                  <p className="mt-5 text-xl text-slate-300 font-medium">
                    Quality used cars, without the second-guessing. Inspected by us, photographed honestly, and backed by a team that answers in minutes.
                  </p>
                </FadeInItem>
                <FadeInItem>
                  <div className="mt-8"><HeroSearch makes={makes} /></div>
                </FadeInItem>
                <FadeInItem>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link href="/used-cars" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-lg font-bold text-black transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,204,0,0.3)]">
                      Browse all cars <ArrowRight className="size-5" />
                    </Link>
                    <Link href="/sell-your-car" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-6 text-lg font-bold text-white transition-colors hover:border-white/40 hover:bg-white/10 glass-panel">
                      Sell your car
                    </Link>
                  </div>
                </FadeInItem>
              </FadeInStagger>
            </div>
          </div>
        </HeroParallax>

        {/* Trust bar */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-start gap-3">
                <t.icon className="size-6 flex-none text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{t.title}</p>
                  <p className="text-sm text-muted-foreground">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* Featured */}
        {featured.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Featured cars</h2>
              <Link href="/used-cars" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((v, i) => <VehicleCard key={v.id} vehicle={v} priority={i < 4} />)}
            </div>
          </section>
        ) : null}



        {/* How it works */}
        <section className="bg-black border-y border-white/5 text-white overflow-hidden py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-20">
              <h2 className="font-heading text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">How it Works</h2>
              <div className="mx-auto mt-6 h-1.5 w-24 bg-primary rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <ScrollReveal key={s.title} delay={i * 0.15}>
                  <div className="relative group p-10 rounded-3xl border border-white/10 bg-[#0a0a0a] transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,204,0,0.15)]">
                    {/* Huge Watermark Number */}
                    <div className="absolute -right-4 -top-8 text-[12rem] font-black leading-none text-white/5 transition-colors duration-500 group-hover:text-primary/10 select-none pointer-events-none">
                      0{i + 1}
                    </div>
                    <div className="relative z-10">
                      <div className="mb-8 inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-black shadow-[0_0_20px_rgba(255,204,0,0.4)]">
                        <s.icon className="size-8" />
                      </div>
                      <h3 className="font-heading text-2xl font-bold text-white mb-4">{s.title}</h3>
                      <p className="text-slate-400 leading-relaxed text-lg">{s.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Sell / Finance banners */}
        <section className="bg-[#131313] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Sell Banner */}
              <ScrollReveal direction="left">
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-black p-10 sm:p-14 transition-all duration-500 hover:border-primary/50 group">
                  <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-[100px] transition-all duration-500 group-hover:bg-primary/30 group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <Handshake className="size-12 text-primary mb-6" />
                    <h3 className="font-heading text-3xl sm:text-4xl font-black text-white leading-tight">Sell or Trade In</h3>
                    <p className="mt-4 text-lg text-slate-400 max-w-sm">Get a premium, fair-market offer on your current vehicle within 24 hours. No hassle, no games.</p>
                    <Link href="/sell-your-car" className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,204,0,0.3)]">
                      Get an Offer <ArrowRight className="size-5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Finance Banner */}
              <ScrollReveal direction="right" delay={0.2}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-black p-10 sm:p-14 transition-all duration-500 hover:border-white/40 group">
                  <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-white/10 blur-[100px] transition-all duration-500 group-hover:bg-white/20 group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <CircleDollarSign className="size-12 text-white mb-6" />
                    <h3 className="font-heading text-3xl sm:text-4xl font-black text-white leading-tight">Bespoke Finance</h3>
                    <p className="mt-4 text-lg text-slate-400 max-w-sm">Access highly competitive, tailored finance options designed to get you behind the wheel effortlessly.</p>
                    <Link href="/finance" className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-8 text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                      Explore Options <ArrowRight className="size-5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {testimonials.length > 0 ? (
          <section className="bg-[#131313] border-y border-white/5">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
              <h2 className="mb-8 font-heading text-2xl font-bold text-foreground sm:text-3xl">What our customers say</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {testimonials.slice(0, 3).map((t) => (
                  <figure key={t.id} className="rounded-xl border border-border bg-card p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < t.rating ? "fill-warning text-warning" : "text-border"}`} />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-body">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-3 text-sm font-semibold text-foreground">{t.customerName}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
