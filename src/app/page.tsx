import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, BadgeCheck, Handshake, CircleDollarSign, ArrowRight, Star,
  Search, Car, Phone, MapPin, ChevronDown, CheckCircle2, ChevronRight,
  TrendingUp, Award, CalendarCheck, HelpCircle, Key, FileText, Check
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
  { icon: BadgeCheck, title: "Roadworthy included", body: "All vehicles come with roadworthy certificate." },
  { icon: CircleDollarSign, title: "Finance available", body: "Competitive rates from trusted lenders." },
  { icon: Handshake, title: "Trade-ins welcome", body: "Get a fair offer on your current car." },
];

const STEPS = [
  { icon: Search, title: "Search cars", body: "Find the right car to suit your needs." },
  { icon: CalendarCheck, title: "Book a test drive", body: "Experience it in person at a time that suits you." },
  { icon: CircleDollarSign, title: "Arrange finance", body: "We'll help you find the best finance options." },
  { icon: Key, title: "Drive away", body: "Complete the paperwork and enjoy your new car." },
];

const CONFIDENCE_ICONS = [
  { icon: ShieldCheck, title: "Multi-point inspection", body: "Every car is thoroughly inspected." },
  { icon: FileText, title: "Clear vehicle history", body: "Full history checks for peace of mind." },
  { icon: CircleDollarSign, title: "Transparent pricing", body: "No hidden fees, no surprises." },
  { icon: Award, title: "Warranty options", body: "Extended warranty available." },
  { icon: Handshake, title: "Friendly local team", body: "Helpful advice from locals who care." },
];

const FAQS = [
  { q: "Can I book a test drive?", a: "Yes, absolutely! You can book a test drive directly through any vehicle page, or by calling our friendly team." },
  { q: "Are your cars inspected?", a: "Yes. Every single vehicle undergoes a comprehensive multi-point mechanical and safety inspection before being listed for sale." },
  { q: "Do you accept trade-ins?", a: "Yes! We accept trade-ins and provide fair, transparent market valuations to make upgrading to your new car as seamless as possible." },
  { q: "Can I sell my car without buying one?", a: "Definitely. We are always looking for quality used cars and can offer you a competitive price even if you don't buy from us." },
  { q: "Is finance available?", a: "Absolutely. We work with leading lenders to provide highly competitive and bespoke finance packages tailored to your budget." },
  { q: "Where are you located?", a: "We are located at 12-14 Parramatta Rd, Granville NSW 2142." },
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
    <div className="bg-white text-slate-900 min-h-screen font-sans">
      <div className="dark">
        <SiteHeader />
      </div>
      
      <main>
        {/* Hero Section */}
        <div className="relative bg-[#0b1320] pb-24 lg:pb-32">
          {/* Background Image - Sports Car */}
          <div className="absolute inset-0 z-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1503376712394-6b5ca7b3a970?auto=format&fit=crop&w=2000&q=80" 
              alt="Sports Car Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1320] via-transparent to-[#0b1320]/80"></div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-32">
            <div className="max-w-xl">
              {rating ? (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-sm text-white">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-bold">{rating}/5</span> from verified customers
                </div>
              ) : null}
              
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white mb-4">
                Find the right car.<br/>Drive away confident.
              </h1>
              
              <p className="text-lg text-slate-300 font-medium mb-8">
                Quality used cars, carefully inspected and ready for Sydney roads.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-20">
                <Link href="/used-cars" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-bold text-black hover:bg-primary-hover transition-colors">
                  Browse Cars
                </Link>
                <Link href="/sell-your-car" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 bg-transparent px-8 font-bold text-white hover:bg-white/10 transition-colors">
                  Sell Your Car
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar (Overlapping Hero) */}
        <div className="relative z-20 -mt-8 sm:-mt-10 mx-auto max-w-4xl px-4 sm:px-6">
          <HeroSearch makes={makes} />
        </div>

        {/* Trust Bar */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 divide-x divide-slate-100">
            {TRUST.map((t) => (
              <div key={t.title} className="flex flex-col items-center text-center px-4">
                <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[#0b1320] text-primary outline outline-offset-4 outline-slate-100">
                  <t.icon className="size-7" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{t.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Cars */}
        {featured.length > 0 ? (
          <section className="bg-slate-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured Cars</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="cursor-pointer rounded-full bg-[#0b1320] px-5 py-2 text-sm font-semibold text-white">All Cars</span>
                    <span className="cursor-pointer rounded-full bg-white border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors">SUV</span>
                    <span className="cursor-pointer rounded-full bg-white border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors">Sedan</span>
                    <span className="cursor-pointer rounded-full bg-white border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors">Hatchback</span>
                    <span className="cursor-pointer rounded-full bg-white border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors">Ute</span>
                  </div>
                </div>
                <Link href="/used-cars" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
                  View all cars <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="dark">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {featured.map((v, i) => <VehicleCard key={v.id} vehicle={v} priority={i < 4} />)}
                </div>
              </div>
              <div className="mt-10 flex justify-center">
                <Link href="/used-cars" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-bold text-black hover:bg-primary-hover transition-colors">
                  View all cars
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Browse by body type */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
          <h2 className="text-[17px] font-bold text-slate-900 mb-5">Browse by body type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(["sedan", "suv", "hatch", "ute", "van", "coupe"] as const).map((b) => (
              <Link key={b} href={bodyTypeHref(b as keyof typeof BODY_TYPE_LABELS)} className="group flex flex-col items-center justify-end rounded-lg border border-slate-200 bg-white p-3 pb-4 transition-all hover:border-slate-300 hover:shadow-sm aspect-[4/3] sm:aspect-auto sm:h-[130px]">
                <div className="flex-1 flex items-center justify-center w-full px-2 mb-1 overflow-hidden">
                  <img 
                    src={`/images/body-types/${b}.png`} 
                    alt={b} 
                    className="w-[95%] h-auto object-contain scale-110 transition-transform duration-300 group-hover:scale-125 mix-blend-multiply" 
                  />
                </div>
                <span className="font-medium text-[13px] text-slate-800">{BODY_TYPE_LABELS[b as keyof typeof BODY_TYPE_LABELS] || b}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Sell Banner */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b1320] text-white shadow-xl">
            <div className="absolute inset-y-0 right-0 w-1/2 opacity-30 sm:opacity-100">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
                alt="Man crossing arms" 
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1320] via-[#0b1320]/80 to-transparent"></div>
            </div>
            
            <div className="relative z-10 px-8 py-16 sm:px-12 sm:w-2/3 lg:w-1/2">
              <h2 className="text-4xl font-black mb-4">Ready to sell your car?</h2>
              <p className="text-lg text-slate-300 mb-8">Get a fair, no-obligation offer without the usual hassle.</p>
              
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="size-5 text-primary" /> Free valuation
                </li>
                <li className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="size-5 text-primary" /> Fast inspection
                </li>
                <li className="flex items-center gap-3 text-slate-200 font-medium">
                  <CheckCircle2 className="size-5 text-primary" /> Secure payment
                </li>
              </ul>
              
              <Link href="/sell-your-car" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-bold text-black hover:bg-primary-hover transition-colors">
                Get My Car Valuation
              </Link>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Buying your next car is simple</h2>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative">
                  <div className="mb-6 flex size-8 items-center justify-center rounded-full bg-primary font-bold text-black">
                    {i + 1}
                  </div>
                  <s.icon className="size-8 text-slate-900 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Finance Split */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-black text-slate-900 mb-6">Flexible car finance made simple</h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Our finance partners make it easier to get behind the wheel with competitive rates and fast approvals.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="size-6 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Competitive rates</span>
                </div>
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="size-6 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Fast decisions</span>
                </div>
                <div className="flex items-start gap-3">
                  <Handshake className="size-6 text-slate-900 shrink-0" />
                  <span className="font-semibold text-slate-900">Trusted lenders</span>
                </div>
              </div>
              <Link href="/finance" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-bold text-black hover:bg-primary-hover transition-colors mb-4">
                Explore Finance Options
              </Link>
              <p className="text-xs text-slate-500">Credit criteria, fees and charges apply. Australian Credit Licence 282145.</p>
            </div>
            <div className="lg:w-1/2 w-full h-[350px]">
              <img 
                src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80" 
                alt="Handing over car keys" 
                className="w-full h-full object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Confidence Comes Standard */}
        <section className="bg-[#0b1320] py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold mb-12">Confidence comes standard</h2>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 text-center">
              {CONFIDENCE_ICONS.map((t) => (
                <div key={t.title} className="flex flex-col items-center">
                  <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full border border-white/20 text-primary">
                    <t.icon className="size-7" />
                  </div>
                  <h3 className="font-bold mb-2">{t.title}</h3>
                  <p className="text-sm text-slate-400">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Trusted by Sydney drivers</h2>
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-10 lg:pb-0 lg:pr-10">
              <div className="text-6xl font-black text-slate-900 mb-4">{rating || "4.8"}/5</div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-6 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-slate-600 mb-2">from <span className="font-bold text-slate-900">400+</span> verified reviews</p>
              <p className="font-bold text-slate-900">Google</p>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {(testimonials.length > 0 ? testimonials.slice(0, 3) : [
                { id: "1", rating: 5, quote: "Fantastic service! The team was very helpful and I love my new car.", customerName: "Sarah M.", photoUrl: null },
                { id: "2", rating: 5, quote: "Highly recommend Cars365. They made the whole process of buying a used car so easy.", customerName: "David L.", photoUrl: null },
                { id: "3", rating: 5, quote: "Great selection of cars and transparent pricing. Very happy with my purchase.", customerName: "Emma W.", photoUrl: null }
              ]).map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-4 ${i < t.rating ? "fill-primary text-primary" : "fill-slate-200 text-slate-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 mb-6 line-clamp-4">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {t.photoUrl ? <img src={t.photoUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-300"></div>}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{t.customerName}</p>
                      <p className="text-xs text-slate-500">Google Review</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link href="/testimonials" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
              Read more reviews <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Better way to buy */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-12 items-center rounded-2xl bg-white overflow-hidden shadow-sm border border-slate-100">
              <div className="w-full lg:w-1/2 h-[300px] lg:h-[450px]">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" 
                  alt="Cars 365 Team" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-full lg:w-1/2 p-8 lg:p-12">
                <h2 className="text-3xl font-black text-slate-900 mb-6">A better way to buy used cars in Sydney</h2>
                <p className="text-slate-600 mb-10 leading-relaxed">
                  At CARS365, we're passionate about cars and committed to honest, straightforward service. Every vehicle is carefully inspected and roadworthy, so you can drive with confidence.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <Car className="size-8 text-slate-900 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-black text-xl text-slate-900">500+</p>
                    <p className="text-xs text-slate-500">Cars Sold</p>
                  </div>
                  <div>
                    <Star className="size-8 text-primary mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-black text-xl text-slate-900">{rating || "4.8"}/5</p>
                    <p className="text-xs text-slate-500">Customer Rating</p>
                  </div>
                  <div>
                    <CalendarCheck className="size-8 text-slate-900 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-black text-xl text-slate-900">7</p>
                    <p className="text-xs text-slate-500">Days a Week</p>
                  </div>
                  <div>
                    <ShieldCheck className="size-8 text-slate-900 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-black text-xl text-slate-900">100%</p>
                    <p className="text-xs text-slate-500">Transparent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Helpful guides */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 border-b border-slate-100">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Helpful guides</h2>
            <Link href="/about" className="hidden md:inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
              View all guides <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { title: "Used Car Buying Checklist", img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80", tag: "Buying Guide" },
              { title: "How Car Finance Works", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80", tag: "Finance" },
              { title: "What Is Your Car Worth?", img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80", tag: "Selling" }
            ].map((g, i) => (
              <Link key={i} href="/about" className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="relative h-48 w-full overflow-hidden">
                  <img src={g.img} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 rounded bg-white px-2 py-1 text-xs font-bold text-slate-900">
                    {g.tag}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-4">{g.title}</h3>
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-500">
                    <span>Read more</span>
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group border-b border-slate-200 pb-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 hover:text-blue-600">
                  {faq.q}
                  <ChevronDown className="size-5 transition-transform group-open:-rotate-180 text-slate-400" />
                </summary>
                <div className="mt-4 text-slate-600 text-sm leading-relaxed pr-8">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

      </main>
      
      <div className="dark">
        <SiteFooter />
      </div>
    </div>
  );
}
