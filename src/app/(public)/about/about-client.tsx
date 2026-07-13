"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Building2, ShieldCheck, HeartHandshake, ArrowRight, Zap, Car, Lock, Globe, AlertCircle, DollarSign } from "lucide-react";
import { useRef } from "react";
export function AboutClient({ header, footer }: { header: React.ReactNode; footer: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax effects
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-50 selection:bg-orange-500/30 selection:text-orange-200">
      {header}

      <main className="relative z-10 overflow-hidden">
        {/* SECTION 1: Artistic Hero */}
        <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8">
          {/* Animated Background Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-orange-600/30 to-amber-500/10 blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, -90, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-slate-600/30 to-slate-800/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          </div>

          <motion.div 
            style={{ y: yHero, opacity: opacityHero }}
            className="relative z-10 max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-6 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-orange-500"></span>
                Our Mission
                <span className="h-px w-8 bg-orange-500"></span>
              </h2>
            </motion.div>
            
            <motion.h1 
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Solving the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600">rental monopoly.</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              We are dismantling the outdated car rental industry, giving power back to local operators and putting customers directly in the driver&apos;s seat.
            </motion.p>
          </motion.div>

          <motion.div 
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span className="text-xs uppercase tracking-widest font-bold">Discover the problem</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent"
            />
          </motion.div>
        </section>

        {/* SECTION 2: The Problem (Dark Mode Sticky Scroll) */}
        <section className="relative bg-slate-950 py-32 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
              
              {/* Sticky Heading */}
              <div className="lg:col-span-5 lg:sticky lg:top-32">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">The industry is <span className="text-muted-foreground line-through">broken</span>.</h2>
                  <p className="text-lg text-slate-400 mb-8">
                    For decades, mobility has been gatekept by three massive global conglomerates. They dictate the rules, control the prices, and leave customers with rigid, impersonal experiences.
                  </p>
                  <p className="text-lg text-slate-400">
                    Meanwhile, brilliant local rental businesses struggle to be found, drowned out by million-dollar marketing budgets.
                  </p>
                </motion.div>
              </div>

              {/* Scrolling Problem Cards */}
              <div className="lg:col-span-7 space-y-8">
                {[
                  {
                    icon: Globe,
                    title: "The Illusion of Choice",
                    desc: "You think you're comparing 10 different rental companies, but most are owned by the exact same parent corporation, artificially keeping prices high."
                  },
                  {
                    icon: DollarSign,
                    title: "Hidden Fees & Middlemen",
                    desc: "Online Travel Agencies (OTAs) charge massive commissions. You pay a premium just to use their platform, while the actual rental operator earns less."
                  },
                  {
                    icon: AlertCircle,
                    title: "Impersonal Service",
                    desc: "You're just a reservation number at an airport desk. If something goes wrong, you're routed through endless offshore call centers."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 hover:bg-slate-900 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-6">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-lg">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: The Solution (Glassmorphism Light Transition) */}
        <section className="relative bg-card text-foreground py-32 rounded-t-[3rem] -mt-10 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          {/* Subtle light background gradients */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-50/50 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-24"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
                A better way forward.
              </h2>
              <p className="text-xl text-slate-600 font-medium">
                Hire Car is a dedicated marketplace that cuts out the middlemen. We connect you directly with strictly verified, independent local fleet owners.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Direct Connection",
                  description: "Deal directly with the fleet owner. No call centers, no runarounds. Just direct communication for better, personalized service.",
                  icon: HeartHandshake,
                  gradient: "from-blue-500/20 to-cyan-500/20",
                  iconColor: "text-blue-600",
                  bgCard: "bg-blue-50/50"
                },
                {
                  title: "Strictly Verified",
                  description: "Every operator undergoes rigorous verification. We check their ABN, contact details, and business standing before they can list a single car.",
                  icon: ShieldCheck,
                  gradient: "from-emerald-500/20 to-teal-500/20",
                  iconColor: "text-emerald-600",
                  bgCard: "bg-emerald-50/50"
                },
                {
                  title: "Zero Booking Fees",
                  description: "We don't charge customers booking fees or hidden commissions that inflate prices. The price you see is the transparent daily rate.",
                  icon: Zap,
                  gradient: "from-orange-500/20 to-amber-500/20",
                  iconColor: "text-orange-600",
                  bgCard: "bg-orange-50/50"
                }
              ].map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`relative p-8 rounded-3xl border border-border ${value.bgCard} shadow-lg shadow-slate-200/50 backdrop-blur-xl overflow-hidden group`}
                >
                  <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${value.gradient} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-8 border border-border group-hover:shadow-md transition-shadow">
                      <value.icon className={`h-8 w-8 ${value.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{value.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: Impact / Visual Data */}
        <section className="bg-muted py-32 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl relative group">
                  <Image
                    src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80"
                    alt="Independent car rental operator handing over keys"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  
                  {/* Floating badge */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="absolute bottom-8 left-8 bg-card/90 backdrop-blur-md rounded-2xl p-6 shadow-xl flex items-center gap-5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-foreground">100%</p>
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Local Business</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-4xl font-black text-foreground mb-6">Empowering communities, not corporations.</h2>
                  <p className="text-xl text-slate-600 leading-relaxed">
                    When you rent through Hire Car, your money stays in the local economy. You're supporting families, small fleet owners, and independent entrepreneurs—not lining the pockets of shareholders.
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    { number: "0", label: "Hidden Platform Fees" },
                    { number: "24/7", label: "Direct Support" },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                      className="border-l-4 border-orange-500 pl-6"
                    >
                      <p className="text-5xl font-black text-foreground mb-2">{stat.number}</p>
                      <p className="text-lg font-bold text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: CTA */}
        <section className="relative py-32 overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] sm:w-[600px] sm:h-[600px] bg-orange-600/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-6xl font-black text-white mb-8"
            >
              Join the movement.
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
            >
              <Link
                href="/search"
                className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-orange-600 px-8 font-bold text-white transition-all hover:bg-orange-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900 w-full sm:w-auto"
              >
                <span className="mr-2 text-lg">Find a Vehicle</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/vendors"
                className="inline-flex h-16 items-center justify-center rounded-2xl border-2 border-slate-700 bg-transparent px-8 text-lg font-bold text-white transition-all hover:bg-slate-800 hover:border-slate-600 w-full sm:w-auto"
              >
                Browse Operators
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {footer}
    </div>
  );
}
