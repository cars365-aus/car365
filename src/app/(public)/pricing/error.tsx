"use client";

import { ErrorState } from "@/components/error-state";

export default function PricingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load pricing"
      message="We couldn't load the pricing information. Please try again."
      onRetry={reset}
    />
  );
}
