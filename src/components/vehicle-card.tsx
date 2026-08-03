"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { motion } from "framer-motion";
import {
  Gauge,
  Fuel,
  Settings2,
  Calendar,
  MapPin,
  ShieldCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { VehicleListItem } from "@/lib/domain";
import {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  formatPrice,
  formatKm,
} from "@/lib/nav";
import { FavoriteButton } from "@/components/favorite-button";
import { cn } from "@/lib/utils";

function vdpHref(v: VehicleListItem) {
  return `/used-cars/${v.makeSlug}/${v.modelSlug}/${v.slug}`;
}

function StatusBadge({ v }: { v: VehicleListItem }) {
  if (v.status === "sold") {
    return (
      <span className="rounded-full bg-red-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
        Sold
      </span>
    );
  }
  if (v.status === "reserved") {
    return (
      <span className="rounded-full bg-amber-400/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-black shadow-sm">
        Reserved
      </span>
    );
  }
  if (v.isNewArrival) {
    return (
      <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
        New arrival
      </span>
    );
  }
  return null;
}

/**
 * ImageCarousel — fully client-rendered sub-component.
 * Keeping all useState/dynamic class logic here prevents SSR ↔ client
 * hydration mismatches on the parent article wrapper.
 */
function ImageCarousel({
  images,
  title,
  href,
  priority,
  priceDrop,
  v,
}: {
  images: string[];
  title: string;
  href: string;
  priority: boolean;
  priceDrop: boolean;
  v: VehicleListItem;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const multiPhoto = images.length > 1;

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((p) => (p - 1 + images.length) % images.length);
    },
    [images.length],
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIdx((p) => (p + 1) % images.length);
    },
    [images.length],
  );

  return (
    <Link
      href={href}
      className="relative block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800"
    >
      <motion.div
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 z-0"
      >
        <ImageWithFallback
          key={images[activeIdx]}
          src={images[activeIdx] || images[0]}
          alt={v.coverImageAlt ?? title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-opacity duration-300"
          priority={priority}
        />
      </motion.div>

      {/* Top Badges */}
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <StatusBadge v={v} />
        {priceDrop ? (
          <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black shadow-sm">
            Price drop
          </span>
        ) : null}
      </div>

      {/* Photo Counter Badge */}
      {multiPhoto ? (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
          <Camera className="size-3 text-white" />
          <span>
            {activeIdx + 1}/{images.length}
          </span>
        </div>
      ) : null}

      {/* Prev / Next Arrow Controls */}
      {multiPhoto ? (
        <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={goPrev}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/80"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/80"
            aria-label="Next photo"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Dot Indicators */}
      {multiPhoto ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {images.slice(0, 5).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "size-1.5 rounded-full transition-all duration-200",
                idx === activeIdx ? "w-3 bg-white" : "bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function VehicleCard({
  vehicle: v,
  priority = false,
  className,
}: {
  vehicle: VehicleListItem;
  priority?: boolean;
  className?: string;
}) {
  const images =
    v.imageUrls && v.imageUrls.length > 0
      ? v.imageUrls
      : [v.coverImageUrl || "/vehicle-placeholder.jpg"];

  const title = `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""}`;
  const priceDrop = v.previousPrice != null && v.previousPrice > v.price;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300",
        className,
      )}
    >
      <ImageCarousel
        images={images}
        title={title}
        href={vdpHref(v)}
        priority={priority}
        priceDrop={priceDrop}
        v={v}
      />

      <FavoriteButton
        vehicleId={v.id}
        className="absolute right-3 top-3 z-10 size-9 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md hover:bg-white dark:hover:bg-slate-800"
      />

      {/* Card Content */}
      <div className="flex flex-1 flex-col bg-white p-4 dark:bg-slate-900">
        <Link href={vdpHref(v)} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-slate-900 transition-colors hover:text-primary dark:text-white">
            {title}
          </h3>
        </Link>

        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-slate-400" />
            <span>{v.year}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="size-4 text-slate-400" />
            <span>{formatKm(v.mileageKm)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="size-4 text-slate-400" />
            <span>{FUEL_LABELS[v.fuelType]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 className="size-4 text-slate-400" />
            <span>{TRANSMISSION_LABELS[v.transmission]}</span>
          </div>
        </dl>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {BODY_TYPE_LABELS[v.bodyType]}
          </span>
          {v.roadworthyIncluded ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
              Roadworthy
            </span>
          ) : null}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {formatPrice(v.price)}
                </span>
                {priceDrop ? (
                  <span className="text-sm tabular-nums text-slate-400 line-through">
                    {formatPrice(v.previousPrice!)}
                  </span>
                ) : null}
              </div>
              {v.weeklyEstimate ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  or ~
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {formatPrice(v.weeklyEstimate)}
                  </span>
                  /wk*
                </p>
              ) : null}
            </div>
            {v.city ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="size-3.5 text-slate-400" />
                {v.city}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
