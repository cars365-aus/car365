import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pt-32 max-w-7xl mx-auto w-full">
      <Skeleton className="h-12 w-3/4 max-w-md rounded-xl" />
      <Skeleton className="h-6 w-1/2 max-w-sm rounded-lg" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
