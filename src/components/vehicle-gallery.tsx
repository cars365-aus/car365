"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VehicleImage } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Swipeable-ish gallery with thumbnails (SRS §9.6). */
export function VehicleGallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const safe = images.length > 0 ? images : [];
  if (safe.length === 0) return null;

  const active = safe[Math.min(index, safe.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + safe.length) % safe.length);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-[16/10]">
        <Image
          src={active.url}
          alt={active.altText ?? title}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
          priority
        />
        {safe.length > 1 ? (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-2 text-foreground shadow-sm backdrop-blur hover:bg-card"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-2 text-foreground shadow-sm backdrop-blur hover:bg-card"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {safe.length}
            </span>
          </>
        ) : null}
      </div>

      {safe.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {safe.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-[4/3] w-24 flex-none overflow-hidden rounded-lg border-2",
                i === index ? "border-primary" : "border-transparent",
              )}
            >
              <Image src={img.url} alt={`Thumbnail ${i + 1} of ${title}`} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
