"use client";

import { ErrorState } from "@/components/error-state";

export default function LeadsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load leads"
      message="We couldn't load your leads data. Please try again."
      onRetry={reset}
    />
  );
}
