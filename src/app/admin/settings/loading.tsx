import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-7 w-32" />
        <Skeleton variant="text" className="h-4 w-64 mt-2" />
      </section>

      {/* Settings form skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton variant="text" className="h-3 w-48" />
          </div>
        ))}
        <div className="pt-4 border-t border-border">
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
