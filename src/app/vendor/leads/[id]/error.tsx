"use client";

import { ErrorState } from "@/components/error-state";

export default function LeadDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load lead"
      message="We couldn't load this lead's details. Please try again."
      onRetry={reset}
    />
  );
}
