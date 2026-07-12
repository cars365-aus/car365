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
        <section className="relative overflow-hidden bg-accent-dark text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              {rating ? (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                  <Star className="size-4 fill-warning text-warning" />
                  <span className="font-semibold">{rating}</span> rated by our customers
                </div>
              ) : null}
              <h1 className="display text-white">Quality used cars, without the second-guessing.</h1>
              <p className="mt-4 text-lg text-slate-300">
                Every car is ours — inspected by us, photographed honestly, and backed by a team that answers in minutes.
              </p>
              <div className="mt-8"><HeroSearch /></div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/used-cars" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover">
                  Browse all cars <ArrowRight className="size-4" />
                </Link>
                <Link href="/sell-your-car" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                  Sell your car
                </Link>
              </div>
            </div>
          </div>
        </section>

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

        {/* Browse by body type */}
        <section className="bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <h2 className="mb-6 font-heading text-2xl font-bold text-foreground sm:text-3xl">Browse by body type</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {NAV_BODY_TYPES.map((b) => (
                <Link key={b} href={bodyTypeHref(b)} className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-foreground transition-shadow hover:shadow-md">
                  {BODY_TYPE_LABELS[b]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by make */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="mb-6 font-heading text-2xl font-bold text-foreground sm:text-3xl">Popular makes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {popularMakes.map((m) => (
              <Link key={m.slug} href={makeHref(m.slug)} className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-foreground transition-shadow hover:shadow-md">
                {m.name}
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-accent-dark text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <h2 className="mb-8 font-heading text-2xl font-bold sm:text-3xl">How it works</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title}>
                  <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <s.icon className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-primary">Step {i + 1}</p>
                  <h3 className="mt-1 font-heading text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sell / Finance banners */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <Handshake className="size-8 text-primary" />
            <h3 className="mt-3 font-heading text-xl font-bold text-foreground">Sell or trade in your car</h3>
            <p className="mt-2 text-body">Get a fair offer fast. Tell us a few details and we&apos;ll be in touch.</p>
            <Link href="/sell-your-car" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary-hover">
              Sell your car <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <CircleDollarSign className="size-8 text-primary" />
            <h3 className="mt-3 font-heading text-xl font-bold text-foreground">Finance made simple</h3>
            <p className="mt-2 text-body">Estimate weekly repayments and let us help arrange competitive finance.</p>
            <Link href="/finance" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary-hover">
              Explore finance <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        {testimonials.length > 0 ? (
          <section className="bg-muted/40">
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
