"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Group by category, preserving order
  const groups = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl space-y-12">
      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="space-y-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {category}
          </h2>
          <div className="space-y-4">
            {items.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={cn(
                    "rounded-2xl border transition-colors duration-300",
                    isOpen
                      ? "border-primary/50 bg-card/80 shadow-[0_4px_24px_rgba(255,204,0,0.05)]"
                      : "border-border bg-card/40 hover:border-white/20 hover:bg-card/60"
                  )}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none"
                  >
                    <span className="font-heading text-lg font-bold text-foreground sm:text-xl">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full bg-black border border-white/10 transition-transform duration-300",
                        isOpen ? "rotate-180 bg-primary border-primary text-black" : "text-white group-hover:border-white/30"
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 text-base leading-relaxed text-slate-400">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
