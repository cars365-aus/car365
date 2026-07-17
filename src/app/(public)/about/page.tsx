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
      <div className="flex flex-col min-h-screen bg-[#050505] selection:bg-primary/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-32 md:pt-48 md:pb-40 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=2500&q=80" 
            alt="Artistic Automotive" 
            className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-[#050505]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        </div>
        
        {/* Artistic glowing orbs */}
        <div className="absolute top-0 right-1/4 z-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] mix-blend-screen animate-pulse duration-1000"></div>

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4 border border-primary/20 shadow-[0_0_15px_rgba(255,204,0,0.15)]">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.1] drop-shadow-2xl">
                Redefining the <span className="text-primary">Automotive</span> Experience
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto drop-shadow">
                We're on a mission to make buying and selling premium vehicles transparent, seamless, and absolutely exhilarating for every Australian.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section - Glassmorphism overlapping hero */}
      <section className="relative z-20 -mt-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 md:p-10 rounded-3xl bg-[#0f0f0f] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
            <ScrollReveal delay={0.1} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-white">10k+</h4>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Vehicles Sold</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-white">98%</h4>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Happy Clients</p>
            </ScrollReveal>
            <ScrollReveal delay={0.3} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-white">50+</h4>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Expert Staff</p>
            </ScrollReveal>
            <ScrollReveal delay={0.4} direction="up" className="space-y-3 relative z-10">
              <h4 className="text-4xl md:text-5xl font-black text-white">24/7</h4>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Support</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-32 relative bg-[#050505]">
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-white">Built on Core Values</h2>
              <p className="text-xl text-slate-400">Everything we do is guided by these principles to ensure you get the best experience possible.</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                icon: Shield,
                title: "Uncompromising Trust",
                description: "Every vehicle on our platform undergoes rigorous verified checks. No hidden histories, no surprises. Just complete peace of mind.",
                delay: 0.1
              },
              {
                icon: Zap,
                title: "Seamless Experience",
                description: "From browsing to financing to delivery, we've engineered every step to be frictionless, lightning fast, and entirely digital.",
                delay: 0.2
              },
              {
                icon: Heart,
                title: "Customer Obsessed",
                description: "Our dedicated concierge team is here 24/7 to ensure your journey is nothing short of extraordinary. Your satisfaction is our benchmark.",
                delay: 0.3
              },
            ].map((value, idx) => (
              <ScrollReveal key={idx} delay={value.delay}>
                <div className="group h-full p-8 md:p-10 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[120px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none translate-x-1/3 -translate-y-1/3`}></div>
                  <div className={`h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:scale-110 transition-all duration-500`}>
                    <value.icon className="h-7 w-7 text-white group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">{value.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-lg">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,_var(--tw-gradient-stops))] from-amber-400 via-primary to-primary"></div>
        
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-black tracking-tight">Ready to find your <br className="hidden md:block" />dream car?</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-xl md:text-2xl text-black/80 font-medium mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied Australians who have discovered a better way to buy and sell premium vehicles.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Link 
                href="/search" 
                className="group relative inline-flex items-center gap-2 bg-black text-white font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 hover:shadow-2xl w-full sm:w-auto justify-center"
              >
                Browse Inventory <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-transparent border-2 border-black hover:bg-black/10 text-black font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 w-full sm:w-auto justify-center"
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
