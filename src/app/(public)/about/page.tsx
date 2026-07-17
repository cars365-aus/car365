import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Heart, Shield, Zap, Target, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "About Us | Cars365",
  description: "Learn about Cars365, Australia's most trusted premium car marketplace.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-32 md:pt-48 md:pb-40 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-400/10 blur-[100px] translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-400/10 blur-[100px] -translate-x-1/3 translate-y-1/4"></div>
        </div>

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-100/50 text-blue-700 font-bold text-sm mb-4 border border-blue-200 shadow-sm">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                Redefining the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Automotive</span> Experience
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
                We're on a mission to make buying and selling premium vehicles transparent, seamless, and absolutely exhilarating for every Australian.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 md:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>
            <ScrollReveal delay={0.1} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-blue-600">10k+</h4>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Vehicles Sold</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-indigo-600">98%</h4>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Happy Clients</p>
            </ScrollReveal>
            <ScrollReveal delay={0.3} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-blue-600">50+</h4>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Expert Staff</p>
            </ScrollReveal>
            <ScrollReveal delay={0.4} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-indigo-600">24/7</h4>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Support</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-32 relative bg-slate-50 mt-20">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900">Built on Core Values</h2>
              <p className="text-xl text-slate-600">Everything we do is guided by these principles to ensure you get the best experience possible.</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                icon: Shield,
                title: "Uncompromising Trust",
                description: "Every vehicle on our platform undergoes rigorous verified checks. No hidden histories, no surprises. Just complete peace of mind.",
                color: "bg-blue-100 text-blue-600",
                delay: 0.1
              },
              {
                icon: Zap,
                title: "Seamless Experience",
                description: "From browsing to financing to delivery, we've engineered every step to be frictionless, lightning fast, and entirely digital.",
                color: "bg-indigo-100 text-indigo-600",
                delay: 0.2
              },
              {
                icon: Heart,
                title: "Customer Obsessed",
                description: "Our dedicated concierge team is here 24/7 to ensure your journey is nothing short of extraordinary. Your satisfaction is our benchmark.",
                color: "bg-sky-100 text-sky-600",
                delay: 0.3
              },
            ].map((value, idx) => (
              <ScrollReveal key={idx} delay={value.delay}>
                <div className="group h-full p-8 md:p-10 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className={`h-16 w-16 rounded-2xl ${value.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-blue-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-blue-600 to-blue-600"></div>
        
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tight">Ready to find your <br className="hidden md:block" />dream car?</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied Australians who have discovered a better way to buy and sell premium vehicles.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Link 
                href="/search" 
                className="group relative inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 hover:shadow-xl w-full sm:w-auto justify-center"
              >
                Browse Inventory <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-400 hover:bg-blue-700 text-white font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 w-full sm:w-auto justify-center"
              >
                Contact Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
      </div>
      <SiteFooter />
    </>
  );
}
