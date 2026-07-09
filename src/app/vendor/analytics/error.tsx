"use client";

import { ErrorState } from "@/components/error-state";

export default function AnalyticsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load analytics"
      message="We couldn't load your analytics data. Please try again."
      onRetry={reset}
    />
  );
}
