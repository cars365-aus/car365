"use client";

import { ErrorState } from "@/components/error-state";

export default function CityLocationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load location"
      message="We couldn't load vehicles for this location. Please try again."
      onRetry={reset}
    />
  );
}
