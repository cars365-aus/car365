import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton variant="text" className="h-4 w-80" />
        </div>
        <Skeleton className="h-20 w-[200px] rounded-xl" />
      </section>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-10" />
            </div>
            <Skeleton variant="text" className="h-4 w-28" />
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="h-3 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Queue Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card shadow-md">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton variant="text" className="h-3 w-16" />
              </div>
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
