"use client";

import { ErrorState } from "@/components/error-state";

export default function VendorProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load vendor profile"
      message="We couldn't load this vendor's information. Please try again."
      onRetry={reset}
    />
  );
}
