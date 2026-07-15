"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Heart, Car, ArrowRight, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface SavedVehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  slug: string;
  price: number;
  year: number;
  mileage_km: number;
  transmission: string;
  fuel_type: string;
  status: string;
}

export default function SavedCarsPage() {
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    async function loadSaved() {
      // Read saved IDs from localStorage (set by the vehicle-card heart button)
      const raw = localStorage.getItem("cars365_favorites");
      const ids: string[] = raw ? JSON.parse(raw) : [];

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("vehicles")
        .select("id, title, make, model, slug, price, year, mileage_km, transmission, fuel_type, status")
        .in("id", ids);

      setVehicles(data ?? []);
      setLoading(false);
    }

    loadSaved();
  }, []);

  const remove = (id: string) => {
    const raw = localStorage.getItem("cars365_favorites");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = ids.filter((i) => i !== id);
    localStorage.setItem("cars365_favorites", JSON.stringify(updated));
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-sm text-white">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Saved Cars</h1>
          <p className="text-sm text-slate-400 mt-1">Vehicles you&apos;ve hearted while browsing.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-white/10 bg-black/20">
          <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Heart className="size-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No saved cars yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm text-sm">
            Tap the heart icon on any vehicle listing to save it here for later.
          </p>
          <Link
            href="/used-cars"
            className="bg-primary text-black font-bold px-6 py-3 rounded-full hover:bg-primary/90 hover:scale-[1.02] transition-all text-sm"
          >
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              {/* Icon */}
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                <Car className="size-7 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-bold text-base text-white truncate group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{v.year}</span>
                  <span>·</span>
                  <span>{v.mileage_km?.toLocaleString()} km</span>
                  {v.transmission && <><span>·</span><span className="capitalize">{v.transmission}</span></>}
                  {v.fuel_type && <><span>·</span><span className="capitalize">{v.fuel_type}</span></>}
                </div>
                {v.status !== "active" && (
                  <span className="inline-block rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                    {v.status === "sold" ? "Sold" : "Unavailable"}
                  </span>
                )}
              </div>

              {/* Price + Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                <p className="text-xl font-black text-primary">${v.price?.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/used-cars/${v.make?.toLowerCase()}/${v.model?.toLowerCase()}/${v.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 h-8 text-xs font-bold text-black hover:scale-105 transition-transform"
                  >
                    View <ArrowRight className="size-3" />
                  </Link>
                  <button
                    onClick={() => remove(v.id)}
                    className="inline-flex items-center justify-center size-8 rounded-lg border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
