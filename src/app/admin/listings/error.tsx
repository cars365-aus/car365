"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminListingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load listings"
      message="We couldn't load the listings data. Please try again."
      onRetry={reset}
    />
  );
}
