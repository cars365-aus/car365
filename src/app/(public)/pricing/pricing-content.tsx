"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionScroll } from "@/components/motion-scroll";
import {
  Check, X, Zap, ArrowRight, Star, Shield, Headphones,
  Building2, Globe, Sparkles, ChevronDown
} from "lucide-react";

const PLANS = [
  {
    code: "starter",
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    vehicles: 5,
    highlight: false,
    badge: null,
    cta: "Get started free",
    description: "Perfect for small local operators just getting started.",
    features: {
      listings: "5 vehicles",
      branches: "1 branch",
      leads: true,
      realtime: false,
      analytics: "Basic",
      support: "Email",
      api: false,
      bulk: false,
      featured: false,
    },
  },
  {
    code: "growth",
    name: "Growth",
    monthlyPrice: 49,
    annualPrice: 529,
    vehicles: 20,
    highlight: true,
    badge: "Most Popular",
    cta: "Start free trial",
    description: "For growing rental shops expanding to multiple locations.",
    features: {
      listings: "20 vehicles",
      branches: "3 branches",
      leads: true,
      realtime: true,
      analytics: "Advanced",
      support: "Priority email + Phone",
      api: false,
      bulk: false,
      featured: true,
    },
  },
  {
    code: "pro",
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 1069,
    vehicles: 50,
    highlight: false,
    badge: "Best Value",
    cta: "Start free trial",
    description: "For established fleets needing full platform access.",
    features: {
      listings: "50 vehicles",
      branches: "Unlimited",
      leads: true,
      realtime: true,
      analytics: "Full + exports",
      support: "Dedicated Phone, Priority Email, Account Manager, Same-Day Response",
      api: true,
      bulk: true,
      featured: true,
    },
  },
];

const FEATURE_ROWS = [
  { key: "listings", label: "Vehicle listings" },
  { key: "branches", label: "Branches" },
  { key: "leads", label: "Lead notifications" },
  { key: "realtime", label: "Real-time lead alerts" },
  { key: "analytics", label: "Analytics" },
  { key: "featured", label: "Featured placements" },
  { key: "bulk", label: "Bulk upload" },
  { key: "api", label: "API access" },
  { key: "support", label: "Support" },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — all plans come with a 14-day free trial, no credit card required. You can cancel anytime before the trial ends.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade at any time from your Billing dashboard. Upgrades take effect immediately; downgrades apply at the next renewal.",
  },
  {
    q: "What happens if I exceed my vehicle limit?",
    a: "You won't be able to add new vehicles until you upgrade your plan. Existing listings remain active.",
  },
  {
    q: "Do you store my payment details?",
    a: "No. All payments are processed securely through Stripe. Hire Car never stores card numbers or banking information.",
  },
  {
    q: "What is the Business/Enterprise plan?",
    a: "For fleets of 300+ vehicles, we offer custom contracts, dedicated account management, white-glove onboarding, and SLA-backed support. Contact our sales team for a quote.",
  },
  {
    q: "Do you offer annual billing discounts?",
    a: "Yes — switching to annual billing saves 10% compared to monthly. Toggle above to see annual pricing.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Secure payments via Stripe" },
  { icon: Zap, label: "14-day free trial" },
  { icon: Headphones, label: "Australian support team" },
  { icon: Globe, label: "Cancel anytime" },
];

export function PricingContent() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <SiteHeader />

      <main className="pt-20">
        {/* Vibrant Hero */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/50 px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/50 via-transparent to-transparent pointer-events-none" />
          <MotionScroll variant="fade-up" className="relative mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-100 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-[#ea580c]" />
              <span className="text-sm font-bold text-[#ea580c]">14-day free trial on all plans</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
              Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">pricing</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              List your fleet, capture leads, and grow your rental business across Australia.
            </p>

            {/* Billing toggle */}
            <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-100 p-1.5 border border-slate-200/60 shadow-inner">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  !annual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
                  annual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Annual
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">Save 10%</span>
              </button>
            </div>
          </MotionScroll>
        </section>

        {/* Plan Cards */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <MotionScroll variant="stagger-container" className="grid gap-8 md:grid-cols-3">
            {PLANS.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;

              return (
                <MotionScroll
                  variant="stagger-item"
                  key={plan.code}
                  className={`relative rounded-[2rem] border-2 p-8 md:p-10 transition-all duration-300 flex flex-col ${
                    plan.highlight
                      ? "border-[#ea580c] bg-white shadow-2xl shadow-orange-500/10 hover:-translate-y-2"
                      : "border-slate-100 bg-white shadow-lg shadow-slate-200/40 hover:-translate-y-2 hover:shadow-xl"
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black tracking-wide uppercase shadow-md ${
                      plan.highlight ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white" : "bg-slate-900 text-white"
                    }`}>
                      <Star className="h-3.5 w-3.5" />
                      {plan.badge}
                    </span>
                  )}

                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
                    <p className="mt-2 text-sm text-slate-500 font-medium">{plan.description}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-6xl font-black text-slate-900 tracking-tight">${price}</span>
                      <span className="text-slate-500 font-medium">/{annual ? "year" : "month"}</span>
                    </div>
                    {annual && (
                      <p className="mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-1 rounded-md">
                        Save ${plan.monthlyPrice * 12 - plan.annualPrice}/year vs monthly
                      </p>
                    )}
                    {!annual && (
                      <p className="mt-2 text-xs text-transparent bg-transparent inline-block px-2 py-1 rounded-md select-none">&nbsp;</p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {[
                      { text: `${plan.features.listings}`, included: true },
                      { text: `${plan.features.branches} branch${plan.features.branches === "1 branch" ? "" : "es"}`, included: true },
                      { text: "Lead email notifications", included: true },
                      { text: "Real-time lead alerts", included: plan.features.realtime },
                      { text: `${plan.features.analytics} analytics`, included: true },
                      { text: "Featured placement eligibility", included: plan.features.featured },
                      { text: "Bulk vehicle upload", included: plan.features.bulk },
                      { text: "API access", included: plan.features.api },
                      { text: `${plan.features.support} support`, included: true },
                    ].map((feat, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-medium ${feat.included ? "text-slate-700" : "text-slate-400"}`}>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          feat.included 
                            ? plan.highlight ? "bg-orange-100 text-[#ea580c]" : "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {feat.included ? "✓" : <X className="h-3 w-3" />}
                        </span>
                        {feat.text}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Link
                      href={`/vendor/upgrade?plan=${plan.code}`}
                      className={`w-full rounded-full py-4 text-base font-bold transition-all flex items-center justify-center gap-2 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-[#ea580c] to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02]"
                          : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02]"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <p className="mt-4 text-center text-xs font-medium text-slate-400">No credit card required</p>
                </MotionScroll>
              );
            })}
          </MotionScroll>

          {/* Enterprise banner */}
          <MotionScroll variant="fade-up" className="mt-12 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 shadow-2xl flex flex-col gap-8 md:flex-row md:items-center md:justify-between border border-slate-700">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="font-black text-white text-2xl tracking-tight">Business & Enterprise</span>
              </div>
              <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
                Need more than 300 vehicles? Get unlimited branches, full API access, a dedicated account manager, custom SLAs, and white-glove onboarding. Built for national operators.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                {["300+ listings", "Unlimited branches", "Custom SLA", "Dedicated manager"].map((f) => (
                  <span key={f} className="flex items-center gap-2 text-sm font-bold text-slate-200 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <Check className="h-4 w-4 text-[#ea580c]" />{f}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/contact?plan=enterprise"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-900 hover:bg-slate-100 transition-all hover:scale-105"
            >
              Talk to Sales <ArrowRight className="h-5 w-5" />
            </Link>
          </MotionScroll>
        </section>

        {/* Trust signals */}
        <section className="bg-white py-16 border-y border-slate-100">
          <MotionScroll variant="stagger-container" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {TRUST_ITEMS.map(({ icon: Icon, label }, i) => (
                <MotionScroll variant="stagger-item" key={i} className="flex flex-col items-center gap-4 text-center group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-[#ea580c] group-hover:border-orange-100 transition-colors">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="text-base font-bold text-slate-700">{label}</p>
                </MotionScroll>
              ))}
            </div>
          </MotionScroll>
        </section>

        {/* Feature Comparison Table */}
        <section className="bg-slate-50 py-24">
          <MotionScroll variant="fade-up" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black text-slate-900 text-center mb-12 tracking-tight">Compare plans in detail</h2>
            <div className="rounded-[2rem] border border-slate-200/60 bg-white overflow-hidden shadow-xl shadow-slate-200/30">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left px-8 py-6 text-base font-bold text-slate-900 w-1/3">Feature</th>
                      {PLANS.map((p) => (
                        <th key={p.code} className={`px-6 py-6 text-center text-lg font-black ${p.highlight ? "text-[#ea580c]" : "text-slate-900"}`}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {FEATURE_ROWS.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-5 text-sm font-semibold text-slate-700">{row.label}</td>
                        {PLANS.map((p) => {
                          const val = p.features[row.key as keyof typeof p.features];
                          return (
                            <td key={p.code} className="px-6 py-5 text-center">
                              {typeof val === "boolean" ? (
                                val ? (
                                  <Check className="h-5 w-5 text-[#ea580c] mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-slate-300 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-slate-900 font-bold">{val as string}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </MotionScroll>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <MotionScroll variant="fade-up">
              <h2 className="text-4xl font-black text-slate-900 text-center mb-4 tracking-tight">Frequently asked questions</h2>
              <p className="text-slate-500 text-center mb-12 font-medium">Everything you need to know about billing and plans.</p>
            </MotionScroll>

            <MotionScroll variant="stagger-container" className="space-y-4">
              {FAQS.map((faq, index) => (
                <MotionScroll key={index} variant="stagger-item">
                  <details className="group bg-slate-50 border border-slate-200 rounded-2xl p-6 cursor-pointer hover:bg-slate-100 transition-colors">
                    <summary className="flex justify-between items-center font-bold text-lg text-slate-900 list-none">
                      {faq.q}
                      <span className="transition-transform group-open:rotate-180">
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </span>
                    </summary>
                    <p className="text-slate-600 mt-4 leading-relaxed font-medium animate-fade-in">
                      {faq.a}
                    </p>
                  </details>
                </MotionScroll>
              ))}
            </MotionScroll>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />
          <MotionScroll variant="fade-up" className="relative mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-[#ea580c] text-[#ea580c]" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Start listing your fleet today</h2>
            <p className="mt-6 text-lg text-slate-300 font-medium">
              Join hundreds of rental operators across Australia. Free 14-day trial — no credit card needed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/vendor/upgrade"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ea580c] to-amber-500 px-8 py-4 text-base font-bold text-white hover:scale-105 transition-transform shadow-xl shadow-orange-500/20"
              >
                <Zap className="h-5 w-5" />
                Start free trial
              </Link>
              <Link
                href="/contact?plan=enterprise"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-4 text-base font-bold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Talk to sales
              </Link>
            </div>
            <p className="mt-8 text-sm font-semibold text-slate-400">
              No setup fees · Cancel anytime · Australian support
            </p>
          </MotionScroll>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
