"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { FilterChips } from "@/components/filter-chips";
import { SearchWidget } from "@/components/search-widget";
import { ErrorState } from "@/components/error-state";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { Vehicle } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewMode = "grid" | "list";
type SortOption = "price-asc" | "price-desc" | "newest" | "rating";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Best Rated" },
];

const PER_PAGE = 20;

// ── Skeleton card ─────────────────────────────────────────────────────────────
function VehicleCardSkeleton() {
  return (
    <div className="rounded-lg bg-white border border-border shadow-[var(--shadow-sm)] overflow-hidden animate-pulse">
      <div className="h-56 bg-muted" />
      <div className="p-6 space-y-4">
        <div className="h-5 bg-muted rounded-lg w-3/4" />
        <div className="h-4 bg-muted/60 rounded-lg w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 bg-muted/60 rounded-lg w-20" />
          <div className="h-6 bg-muted/60 rounded-lg w-16" />
          <div className="h-6 bg-muted/60 rounded-lg w-18" />
        </div>
        <div className="h-11 bg-muted rounded-xl mt-4" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Main search content ───────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSearchModalOpen, setIsMobileSearchModalOpen] = useState(false);

  // Read filters from URL params (single source of truth)
  const [filters, setFilters] = useState(() => ({
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
    seats: searchParams.get("seats") ? parseInt(searchParams.get("seats")!) : undefined,
    transmission: searchParams.get("transmission") || undefined,
    fuel: searchParams.get("fuel") || undefined,
    make: searchParams.get("make") || undefined,
    pickup: searchParams.get("pickup") || undefined,
    returnDate: searchParams.get("return") || undefined,
  }));

  // Sync filters from URL when searchParams change (e.g. SearchWidget navigation)
  useEffect(() => {
    setFilters({
      city: searchParams.get("city") || undefined,
      category: searchParams.get("category") || undefined,
      minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
      seats: searchParams.get("seats") ? parseInt(searchParams.get("seats")!) : undefined,
      transmission: searchParams.get("transmission") || undefined,
      fuel: searchParams.get("fuel") || undefined,
      make: searchParams.get("make") || undefined,
      pickup: searchParams.get("pickup") || undefined,
      returnDate: searchParams.get("return") || undefined,
    });
    setPage(parseInt(searchParams.get("page") || "1") || 1);
  }, [searchParams]);

  const [facetCounts, setFacetCounts] = useState<Record<string, Record<string, number>>>({});

  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1");
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Real data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch from /api/search ────────────────────────────────────────────────
  const fetchVehicles = useCallback(async (
    currentFilters: typeof filters,
    currentPage: number,
    currentSort: SortOption,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentFilters.city) params.set("city", currentFilters.city);
      if (currentFilters.category) params.set("category", currentFilters.category);
      if (currentFilters.make) params.set("make", currentFilters.make);
      if (currentFilters.transmission) params.set("transmission", currentFilters.transmission);
      if (currentFilters.fuel) params.set("fuel", currentFilters.fuel);
      if (currentFilters.minPrice !== undefined) params.set("minPrice", String(currentFilters.minPrice));
      if (currentFilters.maxPrice !== undefined) params.set("maxPrice", String(currentFilters.maxPrice));
      if (currentFilters.seats !== undefined) params.set("seats", String(currentFilters.seats));
      if (currentFilters.pickup) params.set("pickup", currentFilters.pickup);
      if (currentFilters.returnDate) params.set("return", currentFilters.returnDate);
      params.set("page", String(currentPage));
      params.set("perPage", String(PER_PAGE));

      const sortMap: Record<SortOption, string> = {
        "price-asc": "price_per_day_aud:asc",
        "price-desc": "price_per_day_aud:desc",
        "newest": "year:desc",
        "rating": "avg_rating:desc",
      };
      params.set("sortBy", sortMap[currentSort]);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
      setTotal(data.total ?? 0);
      if (data.facetCounts) setFacetCounts(data.facetCounts);
    } catch {
      setError("Something went wrong loading vehicles. Please try again.");
      setVehicles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run search whenever filters, page, or sort change
  useEffect(() => {
    // fetchVehicles manages its own loading state internally via setIsLoading/setVehicles.
    // This is not a direct setState call — it is a side-effectful async fetch triggered by deps.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVehicles(filters, page, sortBy);
  }, [filters, page, sortBy, fetchVehicles]);

  // ── URL sync when filters change ─────────────────────────────────────────
  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | number | undefined>) => {
      const updated = newFilters as typeof filters;
      setFilters(updated);
      setPage(1); // reset to first page when filters change

      // Push new URL so state survives refresh / share
      const params = new URLSearchParams();
      if (updated.city) params.set("city", updated.city);
      if (updated.category) params.set("category", updated.category);
      if (updated.make) params.set("make", updated.make);
      if (updated.transmission) params.set("transmission", updated.transmission);
      if (updated.fuel) params.set("fuel", updated.fuel);
      if (updated.minPrice !== undefined) params.set("minPrice", String(updated.minPrice));
      if (updated.maxPrice !== undefined) params.set("maxPrice", String(updated.maxPrice));
      if (updated.seats !== undefined) params.set("seats", String(updated.seats));
      if (updated.pickup) params.set("pickup", String(updated.pickup));
      if (updated.returnDate) params.set("return", String(updated.returnDate));
      router.push(`/search?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    // Sync page to URL so pagination state survives refresh / share
    const params = new URLSearchParams(window.location.search);
    if (newPage > 1) {
      params.set("page", String(newPage));
    } else {
      params.delete("page");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const showingFrom = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const showingTo = Math.min(page * PER_PAGE, total);

  const activeFilterChips = Object.entries(filters)
    .filter(([_, v]) => v !== undefined && v !== "" && v !== 0)
    .map(([k, v]) => {
      let label = `${v}`;
      if (k === "minPrice") label = `Min $${v}`;
      if (k === "maxPrice") label = `Max $${v}`;
      if (k === "seats") label = `${v}+ Seats`;
      if (k === "returnDate") label = `Return: ${v}`;
      if (k === "pickup") label = `Pickup: ${v}`;
      return { key: k, label };
    });

  // Build visible page numbers (max 5)
  const visiblePages = (() => {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  })();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Search Bar (Desktop) */}
      <div className="hidden md:block bg-white border-b border-slate-200 shadow-sm py-4 relative z-20">
        <div className="mx-auto flex justify-center px-4 sm:px-6 lg:px-8">
          <SearchWidget variant="compact" />
        </div>
      </div>

      {/* Mobile Search Pill */}
      <div className="md:hidden bg-white relative z-10 shadow-[var(--shadow-sm)] border-b border-border py-3 px-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileSearchModalOpen(true)}
            className="flex-1 bg-slate-50 hover:bg-slate-100 transition-colors rounded-full py-2.5 px-4 flex items-center gap-3 border border-slate-200 shadow-sm min-w-0"
          >
            <Search className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-900 truncate w-full text-left">
                {filters.city || "Anywhere in Australia"}
              </span>
              <span className="text-xs font-medium text-slate-500 truncate w-full text-left">
                {filters.pickup && filters.returnDate 
                  ? "Dates selected" 
                  : "Add dates"} • {filters.category || "Any vehicle"}
              </span>
            </div>
          </button>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Open filters"
            className="shrink-0 bg-white hover:bg-slate-50 transition-colors rounded-full p-3 border border-slate-200 shadow-[var(--shadow-sm)] flex items-center justify-center relative"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-600" />
            {activeFilterChips.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                {activeFilterChips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">Search</span>
            {filters.city && (
              <>
                <span className="text-border">/</span>
                <span className="text-foreground">{filters.city}</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {isLoading ? (
              <span className="inline-block h-9 w-56 bg-muted rounded-lg animate-pulse" />
            ) : (
              <>
                {total} vehicle{total !== 1 ? "s" : ""} available
                {filters.city && (
                  <span className="text-primary"> in {filters.city}</span>
                )}
              </>
            )}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            From verified local operators across Australia
          </p>
          {(filters.pickup || filters.returnDate) && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-sm font-medium text-amber-800">
              Dates selected
              {filters.pickup && ` · Pickup ${filters.pickup}`}
              {filters.returnDate && ` · Return ${filters.returnDate}`}
              <span className="text-amber-600 text-xs">(confirm availability with vendor)</span>
            </p>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-[180px]">
              <FilterSidebar
                currentFilters={filters}
                onFilterChange={handleFilterChange}
                totalResults={total}
                facetCounts={facetCounts}
                mobileOpen={isMobileFilterOpen}
                onMobileClose={() => setIsMobileFilterOpen(false)}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Filter Chips */}
            <div className="mb-4">
              <FilterChips 
                filters={activeFilterChips} 
                onRemove={(k) => handleFilterChange({ ...filters, [k]: undefined })} 
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-2 bg-white rounded-lg border border-border shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-4 pl-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-muted text-foreground/70 rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>

                {/* Results Count */}
                {!isLoading && (
                  <span className="text-sm font-medium text-muted-foreground">
                    Showing{" "}
                    <span className="font-bold text-foreground">{showingFrom}–{showingTo}</span>{" "}
                    of{" "}
                    <span className="font-bold text-foreground">{total}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pr-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-sm font-semibold text-foreground/70 hover:border-border/80 hover:bg-muted/80 transition-all"
                  >
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isSortOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-border shadow-[var(--shadow-lg)] z-10 overflow-hidden py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortOpen(false);
                            setPage(1);
                          }}
                          className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                            sortBy === option.value
                              ? "text-primary font-bold bg-primary/5"
                              : "text-foreground/70 hover:bg-muted font-medium"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted p-1 gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-white text-foreground shadow-[var(--shadow-sm)] border border-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-white text-foreground shadow-[var(--shadow-sm)] border border-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Sidebar overlay */}
            <div className="lg:hidden">
              <FilterSidebar
                currentFilters={filters}
                onFilterChange={handleFilterChange}
                totalResults={total}
                facetCounts={facetCounts}
                mobileOpen={isMobileFilterOpen}
                onMobileClose={() => setIsMobileFilterOpen(false)}
                mobileOnly
              />
            </div>

            {/* Error */}
            {error && (
              <ErrorState
                title="Search could not be completed"
                message={error}
                onRetry={() => fetchVehicles(filters, page, sortBy)}
                showHomeLink={true}
                className="bg-white rounded-lg border border-border shadow-[var(--shadow-sm)] mb-6"
              />
            )}

            {/* Results grid / skeleton / empty */}
            {isLoading ? (
              <SkeletonGrid />
            ) : !error && vehicles.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-lg border border-border shadow-[var(--shadow-sm)]">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border mb-6">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No vehicles found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  We couldn&apos;t find any vehicles matching your filters. Try adjusting your search or browsing all locations.
                </p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-[var(--shadow-sm)]"
                >
                  Clear all filters
                </button>
              </div>
            ) : !error ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 grid-cols-1 lg:grid-cols-2"
                      : "space-y-4"
                  }
                >
                  {vehicles.map((vehicle, index) => (
                    <div key={vehicle.id}>
                      <VehicleCard
                        vehicle={vehicle}
                        priority={index < 3}
                        variant={viewMode}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Search results pagination" className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="flex items-center gap-1.5 px-4 py-2.5 border border-border bg-white rounded-lg text-sm font-semibold text-foreground/70 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed shadow-[var(--shadow-sm)] transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>

                    {visiblePages[0] > 1 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          aria-label="Page 1"
                          className="w-11 h-11 rounded-lg text-sm font-bold border border-border bg-white text-foreground/70 hover:bg-muted shadow-[var(--shadow-sm)] transition-colors"
                        >
                          1
                        </button>
                        {visiblePages[0] > 2 && (
                          <span className="text-muted-foreground px-1">…</span>
                        )}
                      </>
                    )}

                    {visiblePages.map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                        className={`w-11 h-11 rounded-lg text-sm font-bold shadow-[var(--shadow-sm)] transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "bg-white border border-border text-foreground/70 hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages && (
                      <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                          <span className="text-muted-foreground px-1">…</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          aria-label={`Page ${totalPages}`}
                          className="w-11 h-11 rounded-lg text-sm font-bold border border-border bg-white text-foreground/70 hover:bg-muted shadow-[var(--shadow-sm)] transition-colors"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Next page"
                      className="flex items-center gap-1.5 px-4 py-2.5 border border-border bg-white rounded-lg text-sm font-semibold text-foreground/70 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed shadow-[var(--shadow-sm)] transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Mobile Search Modal */}
      <Dialog open={isMobileSearchModalOpen} onOpenChange={setIsMobileSearchModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-50 border-0 rounded-2xl w-[95vw]">
          <DialogHeader className="p-4 bg-white border-b border-slate-100">
            <DialogTitle className="text-center font-bold text-slate-800">Edit Search</DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            <SearchWidget variant="sidebar" onSubmit={() => setIsMobileSearchModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
