import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton variant="text" className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Metrics Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-16" />
            <div className="mt-4 pt-4">
              <Skeleton variant="text" className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Bottom Row skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32 mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton variant="text" className="h-4 w-24" />
                  <Skeleton variant="text" className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32 mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
