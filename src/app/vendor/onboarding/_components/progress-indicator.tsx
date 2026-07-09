"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  steps: readonly { label: string }[];
}

export function ProgressIndicator({
  currentStep,
  steps,
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={step.label}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                isCompleted && "text-green-600",
                isActive && "text-slate-900 font-semibold",
                isUpcoming && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted &&
                    "bg-green-100 text-green-700 border border-green-300",
                  isActive &&
                    "bg-slate-900 text-white border border-slate-900",
                  isUpcoming &&
                    "bg-slate-100 text-slate-400 border border-slate-200"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline text-sm">{step.label}</span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "hidden sm:block h-px w-8 ml-2",
                    isCompleted ? "bg-green-300" : "bg-slate-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
