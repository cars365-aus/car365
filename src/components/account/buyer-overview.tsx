"use client";

import { motion } from "framer-motion";
import { Search, Heart, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Active Offers", value: "2", icon: Tag, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Saved Cars", value: "5", icon: Heart, color: "text-red-400", bg: "bg-red-400/10" },
  { label: "Searches", value: "12", icon: Search, color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

export function BuyerOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Welcome back!</h1>
        <p className="mt-2 text-slate-400">Here's an overview of your car buying journey.</p>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Continue Browsing</h2>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-lg backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Search className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white">Find your next dream car</h3>
          <p className="mt-2 text-slate-400 max-w-sm">We've just added 24 new vehicles to our inventory that match your preferences.</p>
          <Link href="/used-cars" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,204,0,0.3)]">
            Browse Inventory <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
