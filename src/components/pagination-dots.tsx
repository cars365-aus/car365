"use client";

interface PaginationDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

/**
 * Dot indicators for image gallery pagination.
 * Current dot is highlighted (larger and different color).
 * Each dot has a 44x44px tappable area via padding.
 *
 * @validates Requirements 2.3
 */
export function PaginationDots({ total, current, onDotClick }: PaginationDotsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-0" role="tablist" aria-label="Image pagination">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          role="tab"
          aria-selected={index === current}
          aria-label={`Go to image ${index + 1} of ${total}`}
          onClick={() => onDotClick?.(index)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-0"
        >
          <span
            className={`block rounded-full transition-all duration-200 ${
              index === current
                ? "w-3 h-3 bg-orange-600"
                : "w-2 h-2 bg-gray-300"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
