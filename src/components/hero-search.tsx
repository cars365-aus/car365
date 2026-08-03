"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import type { Make, Model } from "@/lib/domain";
import { fetchModels } from "@/app/actions/inventory";
import { BUDGET_BANDS } from "@/lib/nav";

export function HeroSearch({ makes }: { makes: Make[] }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!make) {
      requestAnimationFrame(() => {
        setModels([]);
        setModel("");
      });
      return;
    }
    setLoadingModels(true);
    fetchModels(make)
      .then(setModels)
      .finally(() => setLoadingModels(false));
  }, [make]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (maxPrice) params.set("price_max", maxPrice);
    
    const qs = params.toString();
    router.push(qs ? `/used-cars?${qs}` : "/used-cars");
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col sm:flex-row items-center bg-white sm:rounded-full rounded-2xl p-2 sm:p-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 sm:divide-x divide-slate-200">
      
      {/* Make Dropdown */}
      <div className="relative flex-1 w-full flex items-center px-4 py-2 sm:py-0">
        <div className="flex flex-col w-full">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Make</label>
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            className="w-full appearance-none bg-transparent text-base font-semibold text-slate-900 outline-none cursor-pointer pr-8"
            aria-label="Select Make"
          >
            <option value="">All Makes</option>
            {makes.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Model Dropdown */}
      <div className="relative flex-1 w-full flex items-center px-4 py-2 sm:py-0 border-t sm:border-t-0 border-slate-100">
        <div className="flex flex-col w-full">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || loadingModels}
            className="w-full appearance-none bg-transparent text-base font-semibold text-slate-900 outline-none cursor-pointer disabled:opacity-50 pr-8"
            aria-label="Select Model"
          >
            <option value="">Any Model</option>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        {loadingModels ? (
          <Loader2 className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      {/* Price Dropdown */}
      <div className="relative flex-1 w-full flex items-center px-4 py-2 sm:py-0 border-t sm:border-t-0 border-slate-100">
        <div className="flex flex-col w-full">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Max Price</label>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full appearance-none bg-transparent text-base font-semibold text-slate-900 outline-none cursor-pointer pr-8"
            aria-label="Max Price"
          >
            <option value="">Any Price</option>
            {BUDGET_BANDS.map((b) => (
              <option key={b.max} value={String(b.max)}>{b.label}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>

      <button type="submit" className="flex w-full sm:w-[64px] h-[52px] sm:h-[64px] items-center justify-center rounded-xl sm:rounded-full bg-primary font-bold text-black transition-transform hover:scale-105 shadow-lg shadow-primary/30 mt-2 sm:mt-0 sm:ml-2 shrink-0">
        <Search className="size-6" />
        <span className="sm:hidden ml-2">Search Cars</span>
      </button>
    </form>
  );
}
