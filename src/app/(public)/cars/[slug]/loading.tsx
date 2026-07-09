import { Skeleton } from "@/components/ui/skeleton";

export default function CarDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton variant="text" className="h-4 w-12" />
          <Skeleton variant="text" className="h-4 w-4" />
          <Skeleton variant="text" className="h-4 w-14" />
          <Skeleton variant="text" className="h-4 w-4" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>

        {/* Image Gallery skeleton */}
        <div className="rounded-xl border border-border bg-card shadow-md mb-8 overflow-hidden">
          <Skeleton className="aspect-[16/7] md:aspect-[24/9] w-full rounded-none" />
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT: Main content */}
          <div className="space-y-6">
            {/* Title & Details card */}
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-md space-y-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-10 w-3/4" />
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton variant="text" className="h-4 w-28" />
                <Skeleton variant="text" className="h-4 w-20" />
                <Skeleton variant="text" className="h-4 w-32" />
              </div>
              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center rounded-lg bg-muted p-4">
                    <Skeleton variant="circular" className="h-5 w-5 mb-2" />
                    <Skeleton variant="text" className="h-3 w-12 mb-1" />
                    <Skeleton variant="text" className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Distance card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-36 mb-3" />
              <Skeleton variant="text" className="h-4 w-64" />
            </div>

            {/* Features card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Skeleton className="h-4 w-28 mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Pickup location card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <Skeleton className="h-4 w-28 mb-4" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>

          {/* RIGHT: Sticky sidebar */}
          <aside className="space-y-6">
            {/* Pricing panel */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md text-center space-y-2">
              <Skeleton variant="text" className="h-3 w-20 mx-auto" />
              <Skeleton className="h-10 w-24 mx-auto" />
              <Skeleton variant="text" className="h-3 w-16 mx-auto" />
            </div>

            {/* Enquiry form skeleton */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            {/* Vendor contact */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <Skeleton variant="text" className="h-3 w-16" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <Skeleton variant="text" className="h-4 w-28" />
                  <Skeleton variant="text" className="h-3 w-20" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
