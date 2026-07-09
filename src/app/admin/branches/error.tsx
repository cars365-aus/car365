"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminBranchesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load branches"
      message="We couldn't load the branches data. Please try again."
      onRetry={reset}
    />
  );
}
