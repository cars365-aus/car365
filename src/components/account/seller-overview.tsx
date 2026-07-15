"use client";

import { motion } from "framer-motion";
import { Car, Eye, MessageSquare, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Active Listings", value: "0", icon: Car, color: "text-primary", bg: "bg-primary/10" },
  { label: "Total Views", value: "0", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Total Leads", value: "0", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10" },
];

export function SellerOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Seller Dashboard</h1>
        <p className="mt-2 text-slate-400">Manage your inventory and track your marketplace performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-lg backdrop-blur-md hover:border-white/20 transition-colors"
          >
            <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="size-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-lg backdrop-blur-md flex flex-col items-start justify-center"
        >
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Car className="size-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white">Ready to sell?</h3>
          <p className="mt-2 text-slate-400">List your vehicle on our peer-to-peer marketplace and connect directly with buyers.</p>
          <Link href="/sell-your-car" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,204,0,0.3)] w-full">
            List a New Vehicle <ArrowRight className="size-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 to-primary/5 p-8 shadow-lg backdrop-blur-md flex flex-col items-start justify-center relative overflow-hidden"
        >
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <TrendingUp className="size-48 -mr-8 -mb-8" />
          </div>
          <h3 className="text-xl font-bold text-white relative z-10">Market Insights</h3>
          <p className="mt-2 text-slate-400 relative z-10">You have no active listings. Start selling to unlock detailed performance analytics and market insights.</p>
        </motion.div>
      </div>
    </div>
  );
}
