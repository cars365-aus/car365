"use client";

import { ErrorState } from "@/components/error-state";

export default function BillingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load billing"
      message="We couldn't load your billing information. Please try again."
      onRetry={reset}
    />
  );
}
