"use client";

import { ErrorState } from "@/components/error-state";

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load settings"
      message="We couldn't load your organization settings. Please try again."
      onRetry={reset}
    />
  );
}
