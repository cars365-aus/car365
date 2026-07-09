"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminBillingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load billing"
      message="We couldn't load the billing data. Please try again."
      onRetry={reset}
    />
  );
}
