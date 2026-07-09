"use client";

import { ErrorState } from "@/components/error-state";

export default function OnboardingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load onboarding"
      message="We couldn't load the onboarding form. Please try again."
      onRetry={reset}
    />
  );
}
