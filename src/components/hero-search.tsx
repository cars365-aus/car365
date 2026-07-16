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
    <form onSubmit={submit} className="flex w-full max-w-4xl flex-col sm:flex-row items-center gap-2 rounded-2xl bg-card p-3 shadow-2xl border border-white/5">
      
      {/* Make Dropdown */}
      <div className="relative flex-1 w-full">
        <select
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("");
          }}
          className="w-full appearance-none rounded-xl bg-muted/50 px-4 py-3.5 pr-10 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary"
          aria-label="Select Make"
        >
          <option value="">Any Make</option>
          {makes.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Model Dropdown */}
      <div className="relative flex-1 w-full">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make || loadingModels}
          className="w-full appearance-none rounded-xl bg-muted/50 px-4 py-3.5 pr-10 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          aria-label="Select Model"
        >
          <option value="">Any Model</option>
          {models.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
        {loadingModels ? (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      {/* Price Dropdown */}
      <div className="relative flex-1 w-full">
        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full appearance-none rounded-xl bg-muted/50 px-4 py-3.5 pr-10 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary"
          aria-label="Max Price"
        >
          <option value="">Any Price</option>
          {BUDGET_BANDS.map((b) => (
            <option key={b.max} value={String(b.max)}>{b.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <button type="submit" className="flex w-full sm:w-auto h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 font-bold text-black transition-transform hover:scale-105 shadow-lg shadow-primary/20">
        <Search className="size-5" /> Search
      </button>
    </form>
  );
}
