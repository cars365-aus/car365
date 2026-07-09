import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton variant="text" className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Current Plan skeleton */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-2">
              <Skeleton variant="text" className="h-3 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" className="h-4 w-36" />
                <Skeleton variant="text" className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Skeleton className="h-10 w-10 rounded-xl mb-3" />
              <Skeleton className="h-7 w-12" />
              <Skeleton variant="text" className="h-3 w-28 mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Plan picker skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton variant="text" className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-6">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton variant="text" className="h-3 w-28 mb-4" />
              <div className="space-y-2 mb-6">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} variant="text" className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
