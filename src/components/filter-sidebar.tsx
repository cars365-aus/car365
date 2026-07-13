"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, X, RotateCcw } from "lucide-react";

interface FilterSidebarProps {
  currentFilters: {
    city?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    seats?: number;
    transmission?: string;
    fuel?: string;
    make?: string;
  };
  onFilterChange: (filters: Record<string, string | number | undefined>) => void;
  totalResults: number;
  /** Controlled open state for the mobile drawer */
  mobileOpen?: boolean;
  /** Called when the mobile drawer should close */
  onMobileClose?: () => void;
  /** When true, renders ONLY the mobile drawer (no desktop panel) */
  mobileOnly?: boolean;
  /** Live facet counts from search API */
  facetCounts?: Record<string, Record<string, number>>;
}

const categories = [
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "People mover", label: "People Mover" },
  { value: "Van", label: "Van" },
  { value: "Ute", label: "Ute" },
  { value: "Luxury", label: "Luxury" },
];

const transmissions = [
  { value: "Automatic", label: "Automatic" },
  { value: "Manual", label: "Manual" },
];

const fuelTypes = [
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Electric", label: "Electric" },
];

const seatOptions = [
  { value: 2, label: "2 seats" },
  { value: 4, label: "4 seats" },
  { value: 5, label: "5 seats" },
  { value: 7, label: "7 seats" },
  { value: 8, label: "8+ seats" },
];

const popularMakes = [
  { value: "Toyota", label: "Toyota" },
  { value: "Mazda", label: "Mazda" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Kia", label: "Kia" },
  { value: "Ford", label: "Ford" },
  { value: "BMW", label: "BMW" },
];

function facetCount(
  facetCounts: Record<string, Record<string, number>> | undefined,
  field: string,
  value: string,
): number | null {
  const count = facetCounts?.[field]?.[value];
  return count !== undefined ? count : null;
}

interface FilterSectionProps {
  title: string;
  sectionKey: string;
  expandedSections: string[];
  toggleSection: (section: string) => void;
  children: ReactNode;
}

function FilterSection({ title, sectionKey, expandedSections, toggleSection, children }: FilterSectionProps) {
  const isExpanded = expandedSections.includes(sectionKey);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-semibold text-foreground">{title}</span>
        <ChevronDown 
          className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
        />
      </button>
      {isExpanded && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function FilterSidebar({
  currentFilters,
  onFilterChange,
  totalResults,
  mobileOpen = false,
  onMobileClose,
  mobileOnly = false,
  facetCounts,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["category", "price"]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeFiltersCount = Object.values(currentFilters).filter(v => v !== undefined && v !== "" && v !== 0).length;

  const updateFilter = (key: string, value: string | number | undefined) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClose = () => {
    onMobileClose?.();
  };

  const filterContent = (
    <div className="flex-1 overflow-y-auto lg:overflow-visible h-full flex flex-col">
      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 p-4 border-b border-border shrink-0">
          {Object.entries(currentFilters).map(([key, value]) => {
            if (!value || value === "" || value === 0) return null;
            return (
              <span 
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full"
              >
                {key}: {value}
                <button 
                  onClick={() => updateFilter(key, undefined)}
                  className="hover:text-amber-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Filter Sections */}
      <div className="px-4 pb-4 flex-1">
        {/* Category */}
        <FilterSection title="Vehicle Type" sectionKey="category" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.category === cat.value}
                  onChange={(e) => updateFilter("category", e.target.checked ? cat.value : undefined)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground">
                  {cat.label}
                </span>
                {facetCount(facetCounts, "category", cat.value) !== null && (
                  <span className="text-xs text-slate-400">
                    ({facetCount(facetCounts, "category", cat.value)})
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" sectionKey="price" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min ($/day)</label>
                <input
                  type="number"
                  value={currentFilters.minPrice || ""}
                  onChange={(e) => updateFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                  min={0}
                  max={2000}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max ($/day)</label>
                <input
                  type="number"
                  value={currentFilters.maxPrice || ""}
                  onChange={(e) => updateFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="2000"
                  min={0}
                  max={2000}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={currentFilters.maxPrice || 500}
              onChange={(e) => updateFilter("maxPrice", parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </FilterSection>

        {/* Seats */}
        <FilterSection title="Seats" sectionKey="seats" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="flex flex-wrap gap-2">
            {seatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter("seats", currentFilters.seats === option.value ? undefined : option.value)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${currentFilters.seats === option.value 
                    ? "border-amber-500 bg-amber-50 text-amber-700 font-medium" 
                    : "border-border text-slate-600 hover:border-border"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Transmission */}
        <FilterSection title="Transmission" sectionKey="transmission" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="space-y-2">
            {transmissions.map((trans) => (
              <label key={trans.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.transmission === trans.value}
                  onChange={(e) => updateFilter("transmission", e.target.checked ? trans.value : undefined)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground">
                  {trans.label}
                </span>
                {facetCount(facetCounts, "transmission", trans.value) !== null && (
                  <span className="text-xs text-slate-400">
                    ({facetCount(facetCounts, "transmission", trans.value)})
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Fuel Type */}
        <FilterSection title="Fuel Type" sectionKey="fuel" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="space-y-2">
            {fuelTypes.map((fuel) => (
              <label key={fuel.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.fuel === fuel.value}
                  onChange={(e) => updateFilter("fuel", e.target.checked ? fuel.value : undefined)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground">
                  {fuel.label}
                </span>
                {facetCount(facetCounts, "fuel", fuel.value) !== null && (
                  <span className="text-xs text-slate-400">
                    ({facetCount(facetCounts, "fuel", fuel.value)})
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Make */}
        <FilterSection title="Make" sectionKey="make" expandedSections={expandedSections} toggleSection={toggleSection}>
          <div className="space-y-2">
            {popularMakes.map((make) => (
              <label key={make.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.make === make.value}
                  onChange={(e) => updateFilter("make", e.target.checked ? make.value : undefined)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground">
                  {make.label}
                </span>
                {facetCount(facetCounts, "make", make.value) !== null && (
                  <span className="text-xs text-slate-400">
                    ({facetCount(facetCounts, "make", make.value)})
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );

  // If mobileOnly is passed, render a Sheet exclusively
  if (mobileOnly) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[85vw] sm:max-w-[340px] p-0 flex flex-col bg-card">
          <SheetHeader className="p-4 border-b border-border text-left flex flex-row items-center justify-between shrink-0">
            <div>
              <SheetTitle>Filters</SheetTitle>
              <p className="text-sm text-muted-foreground">{totalResults} results</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mr-8"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            )}
          </SheetHeader>
          {filterContent}
          <div className="shrink-0 p-4 border-t border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Show {totalResults} results
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop render (with hidden logic handled by parent)
  return (
    <aside className="hidden lg:block bg-transparent sticky top-24 h-fit">
      <div className="h-full flex flex-col bg-card rounded-xl border border-border shadow-sm">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Filters</h2>
            <p className="text-sm text-muted-foreground">{totalResults} results</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {filterContent}
      </div>
    </aside>
  );
}