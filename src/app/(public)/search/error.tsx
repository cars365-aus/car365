"use client";

import { ErrorState } from "@/components/error-state";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Search could not be completed"
      message="We couldn't load the search results. Please try again."
      onRetry={reset}
    />
  );
}
