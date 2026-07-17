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
      <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-20 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-3xl -translate-x-1/3"></div>

        <div className="container px-4 md:px-6 mx-auto relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 border border-primary/20">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.1]">
                Redefining the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">Automotive</span> Experience
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto">
                We're on a mission to make buying and selling premium vehicles transparent, seamless, and absolutely exhilarating for every Australian.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-black/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <ScrollReveal delay={0.1} direction="up" className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-black text-primary">10k+</h4>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vehicles Sold</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="up" className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-black text-foreground">98%</h4>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Happy Clients</p>
            </ScrollReveal>
            <ScrollReveal delay={0.3} direction="up" className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-black text-foreground">50+</h4>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expert Staff</p>
            </ScrollReveal>
            <ScrollReveal delay={0.4} direction="up" className="space-y-2">
              <h4 className="text-4xl md:text-5xl font-black text-foreground">24/7</h4>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Support</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black">Built on Core Values</h2>
              <p className="text-lg text-muted-foreground">Everything we do is guided by these principles to ensure you get the best experience possible.</p>
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
                <div className="group h-full p-8 md:p-10 rounded-3xl bg-background border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <value.icon className="h-32 w-32" />
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-primary/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <div className="container px-4 md:px-6 mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to find your dream car?</h2>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied Australians who have discovered a better way to buy and sell premium vehicles.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/search" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white font-bold text-lg px-10 py-5 rounded-full transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 w-full sm:w-auto justify-center"
              >
                Browse Inventory <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-background border-2 border-border hover:border-primary text-foreground font-bold text-lg px-10 py-5 rounded-full transition-all hover:-translate-y-1 w-full sm:w-auto justify-center"
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
