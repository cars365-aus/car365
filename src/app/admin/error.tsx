"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <ErrorState
        title="Failed to load admin dashboard"
        message="We couldn't load the admin dashboard data. Please try again."
        onRetry={reset}
      />
      <div className="mt-8 p-4 bg-red-100/10 text-red-500 rounded-md max-w-2xl overflow-auto text-sm">
        <p className="font-bold">Error Details (for debugging):</p>
        <pre>{error.message}</pre>
        {error.stack && <pre className="mt-2 text-xs">{error.stack}</pre>}
      </div>
    </div>
  );
}
