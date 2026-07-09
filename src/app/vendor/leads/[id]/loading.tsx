import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton variant="text" className="h-4 w-24" />

      {/* Lead info card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-4">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 bg-muted/50">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-6 space-y-4 min-h-[400px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? "w-3/5" : "w-2/5"}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-border p-4">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
