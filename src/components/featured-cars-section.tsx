"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { VehicleListItem } from "@/lib/domain";
import { VehicleCard } from "@/components/vehicle-card";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All Cars" },
  { id: "suv", label: "SUV" },
  { id: "sedan", label: "Sedan" },
  { id: "hatch", label: "Hatchback" },
  { id: "ute", label: "Ute" },
];

export function FeaturedCarsSection({ featured }: { featured: VehicleListItem[] }) {
  const [filter, setFilter] = useState("all");

  const filteredVehicles = filter === "all"
    ? featured
    : featured.filter((v) => {
        return v.bodyType.toLowerCase().includes(filter.toLowerCase());
      });

  if (featured.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured Cars</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                    filter === f.id
                      ? "bg-[#0b1320] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Link href="/used-cars" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
            View all cars <ArrowRight className="size-4" />
          </Link>
        </div>
        
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredVehicles.slice(0, 8).map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            No {FILTERS.find((f) => f.id === filter)?.label}s currently featured.
          </div>
        )}
        
        <div className="mt-10 flex justify-center">
          <Link href="/used-cars" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-bold text-black hover:bg-primary-hover transition-colors">
            View all cars
          </Link>
        </div>
      </div>
    </section>
  );
}
