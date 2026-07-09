import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <Skeleton className="h-6 w-48 rounded-full mx-auto bg-white/10" />
          <Skeleton className="h-12 w-80 max-w-full mx-auto bg-white/10" />
          <Skeleton variant="text" className="h-5 w-72 mx-auto bg-white/10" />
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-8 w-16 mx-auto bg-white/10" />
                <Skeleton variant="text" className="h-4 w-24 mx-auto bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City Grid skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-7 w-36" />
          <Skeleton variant="text" className="h-4 w-28" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-5 w-24" />
              <Skeleton variant="text" className="h-3 w-full" />
              <div className="flex items-center gap-4">
                <Skeleton variant="text" className="h-4 w-20" />
                <Skeleton variant="text" className="h-4 w-16" />
              </div>
              <Skeleton variant="text" className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
