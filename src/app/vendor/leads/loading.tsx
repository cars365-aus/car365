import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton variant="text" className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center">
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton variant="text" className="h-3 w-16 mx-auto mt-2" />
          </div>
        ))}
      </div>

      {/* Filter pills skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Lead cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton variant="text" className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-40" />
                <Skeleton variant="text" className="h-4 w-56" />
                <div className="flex gap-4">
                  <Skeleton variant="text" className="h-4 w-32" />
                  <Skeleton variant="text" className="h-4 w-24" />
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:w-56">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
