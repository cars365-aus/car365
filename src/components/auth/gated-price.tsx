"use client";

import { useAuth } from "./auth-provider";
import { Lock } from "lucide-react";
import { formatPrice } from "@/lib/nav";

export function GatedPrice({ price, previousPrice }: { price: number; previousPrice: number | null }) {
  const { isLoggedIn, openAuthModal } = useAuth();
  const priceDrop = previousPrice != null && previousPrice > price;

  if (isLoggedIn) {
    return (
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-heading text-4xl font-extrabold tabular-nums text-foreground">{formatPrice(price)}</span>
        {priceDrop ? (
          <span className="text-lg text-muted-foreground line-through tabular-nums">{formatPrice(previousPrice!)}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={openAuthModal}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-heading text-xl font-bold text-primary transition-transform hover:scale-105 hover:bg-black/80 shadow-lg"
      >
        <Lock className="size-5" /> Login to View Price
      </button>
    </div>
  );
}
