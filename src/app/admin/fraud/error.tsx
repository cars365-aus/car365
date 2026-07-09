"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminFraudError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load fraud data"
      message="We couldn't load the fraud detection data. Please try again."
      onRetry={reset}
    />
  );
}
