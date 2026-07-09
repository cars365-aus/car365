"use client";

import { ErrorState } from "@/components/error-state";

export default function CarDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load vehicle details"
      message="We couldn't load this vehicle's information. Please try again."
      onRetry={reset}
    />
  );
}
