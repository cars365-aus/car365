"use client";

import Link from "next/link";
import { CircleX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  /** Error heading — default: "Something went wrong" */
  title?: string;
  /** Descriptive error message — default: "We couldn't complete your request. Please try again." */
  message?: string;
  /** Retry handler — renders the "Try Again" button when provided */
  onRetry?: () => void;
  /** Whether to show the "Go to homepage" link — default: true */
  showHomeLink?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * ErrorState — a centered error display with retry button and home link.
 * Used across the app for API failures and runtime errors.
 *
 * Per Req 12.5, the retry button always remains enabled — no state machine
 * escalation on consecutive failures.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't complete your request. Please try again.",
  onRetry,
  showHomeLink = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon in a destructive/red tinted container */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <CircleX className="h-8 w-8 text-destructive" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>

      {/* Message */}
      <p className="text-muted-foreground max-w-md mb-8">{message}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onRetry && (
          <Button variant="default" size="lg" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {showHomeLink && (
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Go to homepage
          </Link>
        )}
      </div>
    </div>
  );
}
