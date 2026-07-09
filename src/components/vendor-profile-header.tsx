/**
 * VendorProfileHeader — extracted header section from vendor profile page.
 * Renders vendor name, verified badge, location, fleet size, rating, and description.
 * This component is shared between the vendor profile page and property tests.
 */

import {
  BadgeCheck,
  MapPin,
  Car,
  Star,
  Building2,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface VendorProfileHeaderProps {
  name: string;
  verified: boolean;
  city: string;
  state: string;
  vehicleCount: number;
  averageRating: number | null;
  reviewCount: number;
  description: string | null;
  memberSince?: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function VendorProfileHeader({
  name,
  verified,
  city,
  state,
  vehicleCount,
  averageRating,
  reviewCount,
  description,
  memberSince,
}: VendorProfileHeaderProps) {
  return (
    <Card variant="elevated" className="p-6 md:p-8">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar / Logo placeholder */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                {name}
              </h1>
              {verified && (
                <Badge variant="success" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Location, fleet size, rating */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5" data-testid="vendor-location">
                <MapPin className="h-4 w-4 text-primary" />
                {city}, {state}
              </span>
              <span className="flex items-center gap-1.5" data-testid="vendor-vehicle-count">
                <Car className="h-4 w-4 text-primary" />
                {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""}
              </span>
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Member since {memberSince}
                </span>
              )}
            </div>

            {/* Rating display */}
            {averageRating !== null && (
              <div className="flex items-center gap-2" data-testid="vendor-rating">
                <StarDisplay rating={averageRating} />
                <span className="text-base font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Description (≤2000 chars) */}
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {description.slice(0, 2000)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
