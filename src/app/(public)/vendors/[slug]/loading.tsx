import { Skeleton } from "@/components/ui/skeleton";

export default function VendorProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Vendor Header Card skeleton */}
      <div className="bg-muted border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton variant="text" className="h-4 w-12" />
            <Skeleton variant="text" className="h-4 w-4" />
            <Skeleton variant="text" className="h-4 w-14" />
            <Skeleton variant="text" className="h-4 w-4" />
            <Skeleton variant="text" className="h-4 w-24" />
          </div>

          {/* Header card */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-md">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar placeholder */}
              <Skeleton className="h-20 w-20 rounded-xl" />

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton variant="text" className="h-4 w-32" />
                  <Skeleton variant="text" className="h-4 w-24" />
                  <Skeleton variant="text" className="h-4 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton variant="text" className="h-4 w-12" />
                </div>
              </div>

              {/* Contact sidebar */}
              <div className="hidden lg:block w-64 space-y-3">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="text" className="h-4 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        {/* Vehicle Grid skeleton */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton variant="text" className="h-5 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton variant="text" className="h-5 w-20" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews skeleton */}
        <section>
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" className="h-8 w-8" />
                    <div className="space-y-1">
                      <Skeleton variant="text" className="h-4 w-24" />
                      <Skeleton variant="text" className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
