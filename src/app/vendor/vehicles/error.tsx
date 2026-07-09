"use client";

import { ErrorState } from "@/components/error-state";

export default function VehiclesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load vehicles"
      message="We couldn't load your vehicle listings. Please try again."
      onRetry={reset}
    />
  );
}
