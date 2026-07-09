"use client";

import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  location: string;
  rating: number;
  vehicleType?: string;
  variant?: "default" | "featured" | "compact";
}

export function TestimonialCard({ 
  quote, 
  author, 
  location, 
  rating, 
  vehicleType,
  variant = "default" 
}: TestimonialCardProps) {
  // Truncate quote to max 280 characters
  const displayQuote = quote.length > 280 ? quote.slice(0, 277) + "..." : quote;

  if (variant === "featured") {
    return (
      <div className="relative bg-white rounded-xl p-8 border border-border shadow-sm">
        <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/15" aria-hidden="true" />
        
        {/* Star Rating */}
        <div className="flex gap-1 mb-4" role="img" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={`h-5 w-5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-base text-foreground/80 leading-relaxed mb-6">
          &ldquo;{displayQuote}&rdquo;
        </blockquote>

        {/* Reviewer Name & Location */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {author.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{author}</p>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-muted rounded-lg p-4 border border-border">
        {/* Star Rating */}
        <div className="flex gap-0.5 mb-2" role="img" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={`h-3 w-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-sm text-foreground/70 leading-relaxed mb-3">
          &ldquo;{displayQuote}&rdquo;
        </blockquote>

        {/* Reviewer Name & Location */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{author}</p>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
      {/* Star Rating */}
      <div className="flex gap-1 mb-3" role="img" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-foreground/80 leading-relaxed mb-4">
        &ldquo;{displayQuote}&rdquo;
      </blockquote>

      {/* Reviewer Name & Location */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">{location}</p>
          {vehicleType && (
            <p className="text-xs text-primary/70">Rented: {vehicleType}</p>
          )}
        </div>
      </div>
    </div>
  );
}