"use client";

import { ErrorState } from "@/components/error-state";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load dashboard"
      message="We couldn't load your dashboard data. Please try again."
      onRetry={reset}
    />
  );
}
