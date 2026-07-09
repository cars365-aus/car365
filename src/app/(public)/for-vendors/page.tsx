import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionScroll } from "@/components/motion-scroll";
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Globe,
  ShieldCheck,
  Zap,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Star,
  Sparkles,
  PhoneCall,
} from "lucide-react";

export const metadata = {
  title: "List Your Fleet | For Rental Operators | Hire Car",
  description:
    "Reach thousands of renters across Australia. List your vehicles for free, get direct enquiries, and grow your rental business with Hire Car. Zero marketplace fees.",
};

const benefits = [
  {
    icon: Globe,
    title: "Reach More Customers",
    description: "Get discovered by thousands of renters searching for vehicles in your city every single month.",
    stat: "50K+",
    statLabel: "monthly searches",
  },
  {
    icon: MessageSquare,
    title: "Direct Enquiries",
    description: "Customers contact you directly via phone, WhatsApp, or enquiry form. No middleman, no friction.",
    stat: "100%",
    statLabel: "of leads are yours",
  },
  {
    icon: DollarSign,
    title: "Zero Booking Fees",
    description: "We never take a cut of your bookings. You keep every dollar you earn — that's our promise.",
    stat: "$0",
    statLabel: "commission, ever",
  },
  {
    icon: ShieldCheck,
    title: "Verified Badge",
    description: "Stand out with a verified operator badge that builds instant trust and credibility with renters.",
    stat: "3x",
    statLabel: "more enquiries",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track views, enquiries, and lead performance in real time. Know exactly what's converting.",
    stat: "Live",
    statLabel: "performance data",
  },
  {
    icon: Zap,
    title: "Launch in Minutes",
    description: "Sign up, add your vehicles, start receiving leads. No lengthy onboarding, no contracts.",
    stat: "2 min",
    statLabel: "to go live",
  },
];

const steps = [
  { step: "01", title: "Create your account", description: "Sign up with Google in seconds. Add your business details and ABN to get verified.", icon: ShieldCheck },
  { step: "02", title: "Add your vehicles", description: "List your fleet with photos, pricing, and features. Takes about two minutes per vehicle.", icon: Zap },
  { step: "03", title: "Start getting leads", description: "Renters find you and reach out directly. Manage every enquiry from one clean dashboard.", icon: TrendingUp },
];

const testimonials = [
  { quote: "We've seen a 40% increase in enquiries since joining. The platform genuinely pays for itself within the first week.", name: "Mark Thompson", role: "Fleet Manager", company: "Sydney Auto Hire", rating: 5 },
  { quote: "Simple to set up, beautiful dashboard, and the leads are real. Exactly what our business needed to scale.", name: "Sarah Lin", role: "Owner", company: "Melbourne Car Co.", rating: 5 },
  { quote: "Finally a platform that doesn't take a cut. Direct contact with customers changed everything for us.", name: "James Rivera", role: "Director", company: "Brisbane Rentals", rating: 5 },
];

export default function ForVendorsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SiteHeader />

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-slate-950 min-h-[640px] flex items-center">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80"
            alt="Rental fleet"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(234,88,12,0.25)_0%,_transparent_55%)]" />
          {/* glow orbs */}
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#ea580c]/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20">
            <MotionScroll variant="fade-up" className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ea580c]/15 border border-[#ea580c]/30 px-4 py-2 mb-8">
                <Sparkles className="h-4 w-4 text-[#fb923c]" />
                <span className="text-xs font-bold text-[#fb923c] uppercase tracking-widest">Partner with Hire Car</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.98]">
                Turn your fleet into a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fb923c] via-[#f97316] to-[#ea580c]">
                  lead machine.
                </span>
              </h1>

              <p className="mt-8 text-xl text-slate-300 max-w-xl leading-relaxed">
                Join Australia&apos;s fastest-growing car hire marketplace. List your vehicles, reach thousands of renters, and keep 100% of every booking.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/vendor/upgrade"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#ea580c] px-9 py-4 font-bold text-white text-lg hover:bg-[#f97316] transition-all shadow-2xl shadow-[#ea580c]/30 hover:scale-[1.03]"
                >
                  List Your Fleet Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-7 py-4 font-bold text-white text-lg hover:bg-white/10 transition-colors"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-400">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Free to start</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cancel anytime</span>
              </div>
            </MotionScroll>
          </div>
        </section>

        {/* ===== STATS STRIP ===== */}
        <section className="relative -mt-px bg-gradient-to-r from-[#ea580c] to-[#f97316]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <MotionScroll variant="stagger-container" className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "150+", label: "Active operators" },
                { value: "2,500+", label: "Vehicles listed" },
                { value: "50K+", label: "Monthly visitors" },
                { value: "12+", label: "Cities covered" },
              ].map(({ value, label }) => (
                <MotionScroll key={label} variant="stagger-item" className="text-center">
                  <p className="text-4xl font-black text-white">{value}</p>
                  <p className="text-sm text-orange-50 mt-1 font-semibold">{label}</p>
                </MotionScroll>
              ))}
            </MotionScroll>
          </div>
        </section>

        {/* ===== BENEFITS ===== */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MotionScroll variant="fade-up" className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-sm font-bold text-[#ea580c] uppercase tracking-widest mb-4">Why operators choose us</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                We handle the marketing.<br />You handle the rentals.
              </h2>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <MotionScroll key={benefit.title} variant="stagger-item">
                    <div className="group relative h-full rounded-3xl border border-slate-200 bg-white p-8 hover:shadow-2xl hover:shadow-slate-200/60 hover:border-[#ea580c]/20 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ea580c]/10 group-hover:bg-[#ea580c] transition-colors">
                          <Icon className="h-7 w-7 text-[#ea580c] group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">{benefit.stat}</p>
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{benefit.statLabel}</p>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </MotionScroll>
                );
              })}
            </MotionScroll>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="relative py-24 sm:py-32 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,88,12,0.08)_0%,_transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MotionScroll variant="fade-up" className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-sm font-bold text-[#fb923c] uppercase tracking-widest mb-4">Get started today</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Live in three simple steps
              </h2>
              <p className="mt-5 text-lg text-slate-400">
                From sign-up to your first enquiry in under ten minutes.
              </p>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="grid md:grid-cols-3 gap-8 relative">
              {/* connecting line */}
              <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#ea580c]/0 via-[#ea580c]/40 to-[#ea580c]/0" />
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <MotionScroll key={s.step} variant="stagger-item" className="relative text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ea580c] to-[#f97316] text-white mb-6 shadow-xl shadow-[#ea580c]/20 relative">
                      <Icon className="h-9 w-9" />
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#ea580c] text-xs font-black shadow-md">{s.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                    <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">{s.description}</p>
                  </MotionScroll>
                );
              })}
            </MotionScroll>
          </div>
        </section>

        {/* ===== SOCIAL PROOF ===== */}
        <section className="py-24 sm:py-32 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MotionScroll variant="fade-up" className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-sm font-bold text-[#ea580c] uppercase tracking-widest mb-4">Loved by operators</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Trusted nationwide
              </h2>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <MotionScroll key={t.name} variant="stagger-item">
                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-1 mb-5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ea580c] to-[#f97316] text-white font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <p className="text-sm text-slate-500">{t.role} · {t.company}</p>
                      </div>
                    </div>
                  </div>
                </MotionScroll>
              ))}
            </MotionScroll>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="relative py-28 sm:py-36 overflow-hidden bg-slate-950">
          <Image
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
            alt="Premium car"
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,88,12,0.2)_0%,_transparent_60%)]" />

          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <MotionScroll variant="scale-in">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Ready to grow your<br />rental business?
              </h2>
              <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto">
                Join 150+ operators already winning more leads with Hire Car. It&apos;s free to start.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/vendor/upgrade"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#ea580c] px-10 py-5 font-bold text-white text-lg hover:bg-[#f97316] transition-all shadow-2xl shadow-[#ea580c]/40 hover:scale-[1.03]"
                >
                  Start Listing Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="tel:0434930437"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-5 font-bold text-white text-lg hover:bg-white/10 transition-colors"
                >
                  <PhoneCall className="h-5 w-5" />
                  0434 930 437
                </a>
              </div>
              <p className="mt-8 text-sm text-slate-500">No credit card required · Set up in 2 minutes · Cancel anytime</p>
            </MotionScroll>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
