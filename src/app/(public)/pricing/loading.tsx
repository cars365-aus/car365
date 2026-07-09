import { Skeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-12 w-96 max-w-full mx-auto" />
          <Skeleton variant="text" className="h-5 w-80 max-w-full mx-auto" />
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 ${
                i === 1 ? "ring-2 ring-primary/20 shadow-md scale-[1.02]" : ""
              }`}
            >
              {/* Badge (for middle card) */}
              {i === 1 && <Skeleton className="h-6 w-36 rounded-full mx-auto" />}

              {/* Plan name */}
              <Skeleton className="h-6 w-20 mx-auto" />

              {/* Price */}
              <div className="text-center space-y-1">
                <Skeleton className="h-10 w-24 mx-auto" />
                <Skeleton variant="text" className="h-4 w-16 mx-auto" />
              </div>

              {/* Trial badge */}
              <Skeleton className="h-5 w-28 rounded-full mx-auto" />

              {/* Feature list */}
              <div className="space-y-3 pt-4 border-t border-border">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton variant="circular" className="h-4 w-4" />
                    <Skeleton variant="text" className="h-4 w-full" />
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <Skeleton className="h-11 w-full rounded-lg" />

              {/* Microcopy */}
              <Skeleton variant="text" className="h-3 w-48 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
