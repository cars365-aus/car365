import Link from "next/link";
import Image from "next/image";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MapPin,
  ArrowRight,
  BadgeCheck,
  Zap,
  Car,
  Settings2,
  Fuel,
  Users,
  Snowflake,
  Star,
  ShieldCheck,
  Crown,
  Truck,
  Route,
  Tag,
  CalendarCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SavedVehicleButton } from "@/components/saved-vehicle-button";
import type { Vehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  variant?: "default" | "compact" | "featured" | "grid" | "list";
  saved?: boolean;
}

export function VehicleCard({ vehicle, priority = false, variant = "default", saved = false }: VehicleCardProps) {
  const hasRating = (vehicle.reviewCount ?? 0) > 0 && vehicle.avgRating != null;
  const unlimitedKm = vehicle.dailyDistanceLimitKm == null;
  const primaryFeature = vehicle.features?.includes("Air Conditioning") ? "Air Conditioning" : vehicle.features?.[0];

  if (variant === "compact") {
    return (
      <Card variant="interactive" className="flex-row p-0 gap-0 card-lift border-slate-200/60 shadow-sm overflow-hidden bg-white/95 relative group">
        <div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-none bg-slate-100">
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={`${vehicle.title}`}
            fill
            priority={priority}
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <CardContent className="flex-1 min-w-0 py-3 px-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 tracking-tight truncate !text-base">
              {vehicle.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="truncate text-sm font-medium text-slate-600">{vehicle.vendorName}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-baseline text-slate-900">
              <span className="text-lg font-black">${vehicle.pricePerDayAud}</span>
              <span className="text-xs font-bold text-slate-500 ml-1">/day</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // FLUID REFERENCE DESIGN (Always renders as reference design, perfectly fluid via flex-wrap)
  return (
    <div className="w-full h-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#ea580c]/30 transition-all duration-300 group flex flex-col overflow-hidden">
      
      {/* 1. HERO IMAGE SECTION */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[1.8/1] bg-slate-100 z-0">
        <Link href={`/cars/${vehicle.slug}`} className="absolute inset-0" aria-label={vehicle.title}>
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={vehicle.title}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none opacity-80" />
        
        {/* Top Left: Featured Badge */}
        {(variant === "featured" || priority) && (
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 bg-[#FF4D00] text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-white text-white" />
            <span className="text-xs font-bold tracking-wide">Featured</span>
          </div>
        )}

        {/* Top Right: Favourite Button */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
          </div>
        </div>

        {/* Bottom Left: Instant Booking */}
        {vehicle.instantBook && (
          <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-10 bg-[#101828] text-white px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[#00E5FF] fill-[#00E5FF]" />
            <span className="text-xs sm:text-sm font-semibold">Instant Booking</span>
          </div>
        )}

        <div className="absolute -bottom-5 right-3 sm:-bottom-8 sm:right-6 z-20 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-2.5 sm:p-4 flex flex-col items-center min-w-[110px] sm:min-w-[140px]">
          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wide">From</span>
          <div className="flex items-baseline mt-0.5 mb-1 sm:mb-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#101828] leading-none">${vehicle.pricePerDayAud}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 ml-1">/ day</span>
          </div>
          <div className="w-full h-px bg-slate-100 mb-1.5 sm:mb-2" />
          <div className="w-full flex flex-col gap-0.5 text-center">
            {vehicle.weeklyRateAud && (
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Weekly from <strong className="text-[#FF4D00]">${vehicle.weeklyRateAud}</strong></span>
            )}
            {vehicle.monthlyRateAud && (
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Monthly from <strong className="text-[#FF4D00]">${vehicle.monthlyRateAud}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY SECTION */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6 pt-8 sm:pt-10 z-10 bg-white relative">
        
        {/* Row 1: Identity & Host */}
        <div className="flex flex-wrap items-start justify-between gap-y-3 gap-x-5 mb-4">
          <div className="flex flex-col min-w-[200px] flex-1">
            <Link href={`/cars/${vehicle.slug}`}>
              <h2 className="!text-base sm:!text-lg font-bold text-[#101828] leading-snug hover:text-[#FF4D00] transition-colors line-clamp-2">
                {vehicle.title}
              </h2>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-1.5">
              {hasRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800]" />
                  <span className="font-bold text-[#101828] text-sm">{vehicle.avgRating!.toFixed(1)}</span>
                  <span className="text-slate-500 font-medium text-xs">({vehicle.reviewCount} Reviews)</span>
                </div>
              )}
              {hasRating && vehicle.verified && <span className="text-slate-300">|</span>}
              {vehicle.verified && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#249AA0]" />
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-600">Verified Host</span>
                </div>
              )}
            </div>
          </div>
          
          <Link href={vehicle.vendorSlug ? `/vendors/${vehicle.vendorSlug}` : `/cars/${vehicle.slug}`} className="flex items-center gap-2.5 shrink-0">
            {vehicle.vendorLogoUrl ? (
              <Image src={vehicle.vendorLogoUrl} alt={vehicle.vendorName} width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold uppercase text-slate-500">
                {vehicle.vendorName.substring(0, 2)}
              </div>
            )}
            <div className="flex flex-col items-start sm:items-end">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#101828] text-sm">{vehicle.vendorName}</span>
                <BadgeCheck className="h-4 w-4 text-[#1D9BF0] fill-[#1D9BF0] stroke-white shrink-0" />
              </div>
              {vehicle.superHost && (
                <div className="flex items-center gap-1 mt-0.5 bg-[#FFF5F0] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#FF4D00]">
                  <Crown className="h-3 w-3" /> Super Host
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="w-full h-px bg-slate-100 mb-5" />

        {/* Row 2: Specs Grid - Scrollable on Mobile, Single Line on Desktop */}
        <div className="flex items-center sm:justify-between w-full mb-4 gap-4 sm:gap-1.5 overflow-x-auto snap-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 sm:gap-1 min-w-0 shrink-0 snap-start">
            <Car className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-[11px] sm:text-[10px] truncate leading-tight">{vehicle.category}</span>
              <span className="text-slate-500 text-[9px] sm:text-[8px] font-medium capitalize tracking-wide truncate">Body Type</span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />
          
          <div className="flex items-center gap-1.5 sm:gap-1 min-w-0 shrink-0 snap-start">
            <Settings2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-[11px] sm:text-[10px] truncate leading-tight">{vehicle.transmission}</span>
              <span className="text-slate-500 text-[9px] sm:text-[8px] font-medium capitalize tracking-wide truncate">Transmission</span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:gap-1 min-w-0 shrink-0 snap-start">
            <Fuel className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-[11px] sm:text-[10px] truncate leading-tight">{vehicle.fuel}</span>
              <span className="text-slate-500 text-[9px] sm:text-[8px] font-medium capitalize tracking-wide truncate">Fuel Type</span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:gap-1 min-w-0 shrink-0 snap-start">
            <Users className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-[11px] sm:text-[10px] truncate leading-tight">{vehicle.seats} Seats</span>
              <span className="text-slate-500 text-[9px] sm:text-[8px] font-medium capitalize tracking-wide truncate">Seating</span>
            </div>
          </div>
          
          {primaryFeature && (
            <>
              <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-1 min-w-0 shrink-0 snap-start pr-4 sm:pr-0">
                <Snowflake className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#101828] font-bold text-[11px] sm:text-[10px] truncate leading-tight">{primaryFeature}</span>
                  <span className="text-slate-500 text-[9px] sm:text-[8px] font-medium capitalize tracking-wide truncate">Features</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-full h-px bg-slate-100 mb-4" />

        {/* Row 3: Location & Delivery */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-semibold text-sm truncate">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
              <span className="text-slate-500 text-[10px] font-medium capitalize tracking-wide">Pickup location</span>
            </div>
          </div>
          {vehicle.freeDelivery && (
            <div className="flex items-center gap-1.5 text-[#2E9D68] font-semibold text-xs bg-transparent px-0 py-0 rounded-none border-0">
              Free delivery available
              <Truck className="h-4 w-4 ml-0.5" />
            </div>
          )}
        </div>

        {/* NO DIVIDER HERE, just like the reference! */}

        {/* Row 4: Trust Chips - Scrollable on Mobile, Single Line on Desktop */}
        <div className="flex items-center sm:justify-between w-full mb-4 border-t border-slate-100 pt-4 gap-2 sm:gap-2 overflow-x-auto snap-x overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[#EFFBF3] text-[#2E9D68] px-2.5 sm:px-2 py-2 sm:py-1.5 rounded-md font-bold text-[10px] sm:text-[9px] flex-1 sm:flex-1 shrink-0 snap-start min-w-[120px] sm:min-w-0">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" /> <span className="truncate">Free cancellation</span>
          </div>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />
          
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[#EDF5FF] text-[#2072EA] px-2.5 sm:px-2 py-2 sm:py-1.5 rounded-md font-bold text-[10px] sm:text-[9px] flex-1 sm:flex-1 shrink-0 snap-start min-w-[120px] sm:min-w-0">
            <Tag className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" /> <span className="truncate">No hidden fees</span>
          </div>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />
          
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[#F7F0FF] text-[#7B42F6] px-2.5 sm:px-2 py-2 sm:py-1.5 rounded-md font-bold text-[10px] sm:text-[9px] flex-1 sm:flex-1 shrink-0 snap-start min-w-[110px] sm:min-w-0 pr-4 sm:pr-2">
            <Route className="h-3.5 w-3.5 sm:h-3 sm:w-3 shrink-0" /> <span className="truncate">Unlimited km</span>
          </div>
        </div>

        {/* Row 5: Primary CTA */}
        <Link
          href={`/cars/${vehicle.slug}`}
          className="w-full flex items-center justify-center gap-1.5 bg-[#FF4D00] hover:bg-[#E64500] text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm shadow-[0_4px_14px_rgba(255,77,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,77,0,0.4)] hover:-translate-y-0.5 transition-all group/btn mt-auto"
        >
          Check Availability
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>

      </div>
    </div>
  );
}
