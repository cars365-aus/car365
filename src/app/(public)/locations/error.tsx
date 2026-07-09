"use client";

import { ErrorState } from "@/components/error-state";

export default function LocationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load locations"
      message="We couldn't load the locations page. Please try again."
      onRetry={reset}
    />
  );
}
