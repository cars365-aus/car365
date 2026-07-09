"use client";

import { ErrorState } from "@/components/error-state";

export default function AdminVendorsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load vendors"
      message="We couldn't load the vendor data. Please try again."
      onRetry={reset}
    />
  );
}
