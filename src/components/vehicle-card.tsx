import Link from "next/link";
import Image from "next/image";
import { Gauge, Fuel, Settings2, Calendar, MapPin, ShieldCheck } from "lucide-react";
import type { VehicleListItem } from "@/lib/domain";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, formatPrice, formatKm } from "@/lib/nav";
import { FavoriteButton } from "@/components/favorite-button";
import { cn } from "@/lib/utils";

function vdpHref(v: VehicleListItem) {
  return `/used-cars/${v.makeSlug}/${v.modelSlug}/${v.slug}`;
}

function StatusBadge({ v }: { v: VehicleListItem }) {
  if (v.status === "sold") {
    return <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Sold</span>;
  }
  if (v.status === "reserved") {
    return <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">Reserved</span>;
  }
  if (v.isNewArrival) {
    return <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">New arrival</span>;
  }
  return null;
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
  const title = `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""}`;
  const priceDrop = v.previousPrice != null && v.previousPrice > v.price;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <Link href={vdpHref(v)} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={v.coverImageUrl ?? ""}
          alt={v.coverImageAlt ?? title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          priority={priority}
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StatusBadge v={v} />
          {priceDrop ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Price drop</span>
          ) : null}
        </div>
      </Link>

      <FavoriteButton
        vehicleId={v.id}
        className="absolute right-3 top-3 size-9 bg-card/90 text-foreground shadow-sm backdrop-blur hover:bg-card"
      />

      <div className="flex flex-1 flex-col p-4">
        <Link href={vdpHref(v)} className="focus-visible:outline-none">
          <h3 className="font-heading text-base font-semibold leading-snug text-foreground line-clamp-1">
            {title}
          </h3>
        </Link>

        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-body">
          <div className="flex items-center gap-1.5"><Calendar className="size-4 text-muted-foreground" /><span>{v.year}</span></div>
          <div className="flex items-center gap-1.5"><Gauge className="size-4 text-muted-foreground" /><span>{formatKm(v.mileageKm)}</span></div>
          <div className="flex items-center gap-1.5"><Fuel className="size-4 text-muted-foreground" /><span>{FUEL_LABELS[v.fuelType]}</span></div>
          <div className="flex items-center gap-1.5"><Settings2 className="size-4 text-muted-foreground" /><span>{TRANSMISSION_LABELS[v.transmission]}</span></div>
        </dl>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5">{BODY_TYPE_LABELS[v.bodyType]}</span>
          {v.roadworthyIncluded ? (
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-success" />Roadworthy</span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-xl font-bold tabular-nums text-foreground">{formatPrice(v.price)}</span>
                {priceDrop ? (
                  <span className="text-sm text-muted-foreground line-through tabular-nums">{formatPrice(v.previousPrice!)}</span>
                ) : null}
              </div>
              {v.weeklyEstimate ? (
                <p className="text-xs text-muted-foreground">
                  or ~<span className="font-medium text-body tabular-nums">{formatPrice(v.weeklyEstimate)}</span>/wk*
                </p>
              ) : null}
            </div>
            {v.city ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />{v.city}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
