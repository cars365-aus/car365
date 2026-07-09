"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 20, 
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1" role={interactive ? "group" : undefined} aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const activeRating = interactive && hoverRating > 0 ? hoverRating : rating;
        const isFilled = starValue <= activeRating;

        if (!interactive) {
          return (
            <Star
              key={i}
              size={size}
              aria-hidden
              className={`${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
            />
          );
        }

        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${starValue} star${starValue !== 1 ? "s" : ""}`}
            className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
            style={{ width: size, height: size }}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRatingChange?.(starValue)}
          >
            <Star
              size={size}
              className={`${isFilled ? "fill-amber-400 text-amber-400" : "text-slate-300"} transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
