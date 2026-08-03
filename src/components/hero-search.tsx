"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import type { Make, Model } from "@/lib/domain";
import { fetchModels } from "@/app/actions/inventory";
import { BUDGET_BANDS, NAV_BODY_TYPES, BODY_TYPE_LABELS } from "@/lib/nav";

export function HeroSearch({ makes }: { makes: Make[] }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bodyType, setBodyType] = useState("");
  
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
    if (bodyType) params.set("body_type", bodyType);
    
    const qs = params.toString();
    router.push(qs ? `/used-cars?${qs}` : "/used-cars");
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col sm:flex-row items-center bg-white rounded-2xl p-2 sm:p-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:divide-x divide-slate-200">
      
      {/* Make Dropdown */}
      <div className="relative flex-1 w-full flex items-center px-4 py-2 sm:py-0">
        <div className="flex flex-col w-full">
          <label className="text-[12px] font-bold text-slate-900 mb-1">Make</label>
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            className="w-full appearance-none bg-transparent text-[15px] font-medium text-slate-600 outline-none cursor-pointer pr-8"
            aria-label="Select Make"
          >
            <option value="">Any Make</option>
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
          <label className="text-[12px] font-bold text-slate-900 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || loadingModels}
            className="w-full appearance-none bg-transparent text-[15px] font-medium text-slate-600 outline-none cursor-pointer disabled:opacity-50 pr-8"
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
          <label className="text-[12px] font-bold text-slate-900 mb-1">Price</label>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full appearance-none bg-transparent text-[15px] font-medium text-slate-600 outline-none cursor-pointer pr-8"
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

      {/* Body Type Dropdown */}
      <div className="relative flex-1 w-full flex items-center px-4 py-2 sm:py-0 border-t sm:border-t-0 border-slate-100">
        <div className="flex flex-col w-full">
          <label className="text-[12px] font-bold text-slate-900 mb-1">Body Type</label>
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            className="w-full appearance-none bg-transparent text-[15px] font-medium text-slate-600 outline-none cursor-pointer pr-8"
            aria-label="Body Type"
          >
            <option value="">Any Body Type</option>
            {NAV_BODY_TYPES.map((b) => (
              <option key={b} value={b}>{BODY_TYPE_LABELS[b]}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>

      <button type="submit" className="flex w-full sm:w-auto h-[52px] sm:h-[60px] items-center justify-center rounded-xl bg-primary px-8 font-bold text-black transition-transform hover:scale-105 mt-2 sm:mt-0 sm:ml-2 shrink-0">
        <Search className="size-5 mr-2" />
        <span>Search Cars</span>
      </button>
    </form>
  );
}
