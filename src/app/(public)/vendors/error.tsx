"use client";

import { ErrorState } from "@/components/error-state";

export default function VendorsDirectoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load operators"
      message="We couldn't load the operators directory. Please try again."
      onRetry={reset}
    />
  );
}
