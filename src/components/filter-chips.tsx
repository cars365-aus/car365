"use client";

import { X } from "lucide-react";

interface Filter {
  key: string;
  label: string;
}

interface FilterChipsProps {
  filters: Filter[];
  onRemove: (key: string) => void;
}

/**
 * Horizontal scrollable row of dismissible filter chips.
 * Each chip meets 44x44px touch target requirements.
 *
 * @validates Requirements 8.4, 1.1
 */
export function FilterChips({ filters, onRemove }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none py-2">
      {filters.map((filter) => (
        <div
          key={filter.key}
          className="flex items-center gap-1 shrink-0 rounded-full bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800 min-h-[44px]"
        >
          <span className="whitespace-nowrap">{filter.label}</span>
          <button
            onClick={() => onRemove(filter.key)}
            aria-label={`Remove ${filter.label} filter`}
            className="flex items-center justify-center rounded-full p-1 hover:bg-orange-100 transition-colors min-w-[44px] min-h-[44px] -mr-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
