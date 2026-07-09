"use client";

import Link from "next/link";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { MapPin, Car, ArrowRight } from "lucide-react";

interface LocationCardProps {
  name: string;
  imageUrl: string;
  vehicleCount: number;
  startingPrice: number;
  href: string;
}

export function LocationCard({ name, imageUrl, vehicleCount, startingPrice, href }: LocationCardProps) {
  return (
    <Link 
      href={href}
      className="group relative overflow-hidden rounded-xl bg-card shadow-sm border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative h-44 overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={`Car rentals in ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Location Name Overlay */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-white" />
          <span className="text-lg font-bold text-white">{name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Car className="h-4 w-4 text-primary" />
              <span>
                {vehicleCount > 0
                  ? `${vehicleCount} vehicles available`
                  : "Vehicles coming soon"}
              </span>
            </div>
            {vehicleCount > 0 && startingPrice > 0 && (
              <p className="text-sm font-semibold text-foreground">
                From <span className="text-primary font-bold">${startingPrice}</span>/day
              </p>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
