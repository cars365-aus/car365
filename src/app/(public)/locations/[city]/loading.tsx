import { Skeleton } from "@/components/ui/skeleton";

export default function CityLocationLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-800 px-4 py-8 lg:py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton variant="text" className="h-4 w-12 bg-white/10" />
            <Skeleton variant="text" className="h-4 w-4 bg-white/10" />
            <Skeleton variant="text" className="h-4 w-20 bg-white/10" />
            <Skeleton variant="text" className="h-4 w-4 bg-white/10" />
            <Skeleton variant="text" className="h-4 w-24 bg-white/10" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 bg-white/10" />
                <Skeleton variant="text" className="h-4 w-12 bg-white/10" />
              </div>
              <Skeleton className="h-12 w-72 bg-white/10" />
              <Skeleton variant="text" className="h-5 w-64 bg-white/10" />
            </div>

            {/* Price badge */}
            <Skeleton className="h-24 w-32 rounded-2xl bg-white/10" />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            <Skeleton variant="text" className="h-4 w-24 bg-white/10" />
            <Skeleton variant="text" className="h-4 w-40 bg-white/10" />
          </div>
        </div>
      </section>

      {/* Vehicle Grid skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-6 lg:py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton variant="text" className="h-4 w-40" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
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
    </div>
  );
}
