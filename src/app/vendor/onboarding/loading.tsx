import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {/* Progress indicator skeleton */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="circular" className="h-8 w-8" />
            {i < 2 && <Skeleton className="h-0.5 w-12" />}
          </div>
        ))}
      </div>

      {/* Form card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton variant="text" className="h-4 w-72 mb-8" />

        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <Skeleton className="h-11 w-full rounded-lg mt-8" />
      </div>
    </div>
  );
}
