"use client";

import { ErrorState } from "@/components/error-state";

export default function BrandCityError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load vehicles"
      message="We couldn't load vehicles for this brand and location. Please try again."
      onRetry={reset}
    />
  );
}
