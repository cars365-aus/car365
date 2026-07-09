import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-7 w-28" />
        <Skeleton variant="text" className="h-4 w-56 mt-2" />
      </div>

      {/* Top Metrics skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-16" />
            <div className="mt-4 pt-4">
              <Skeleton variant="text" className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Lead & Fleet row skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32 mb-5" />
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-4 w-8" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-28 mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton variant="text" className="h-4 w-24" />
                    <Skeleton variant="text" className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Channel skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-5 w-48 mb-5" />
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <Skeleton variant="text" className="h-4 w-28" />
                <Skeleton variant="text" className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
