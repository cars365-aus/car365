"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminReviewsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load reviews"
      message="We couldn't load the reviews data. Please try again."
      onRetry={reset}
    />
  );
}
