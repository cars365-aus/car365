"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Icon element (e.g. lucide-react icon) — defaults to SearchX */
  icon?: React.ReactNode;
  /** Heading text, e.g. "No vehicles found" */
  title: string;
  /** Descriptive message, e.g. "Try adjusting your search filters" */
  description: string;
  /** CTA button label, e.g. "Clear Filters" */
  actionLabel?: string;
  /** Optional link href for the CTA (renders as a link) */
  actionHref?: string;
  /** Optional click handler for the CTA (for client-side actions) */
  onAction?: () => void;
}

/**
 * EmptyState — centered empty state display with icon, heading, message, and CTA.
 * Used across the app for zero-item lists and grids.
 *
 * Validates: Requirements 5.4, 12.3
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon in rounded muted container */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {icon || <SearchX className="h-8 w-8 text-muted-foreground" />}
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>

      {/* CTA — link variant */}
      {actionLabel && actionHref && !onAction && (
        <Link href={actionHref}>
          <Button variant="outline">{actionLabel}</Button>
        </Link>
      )}

      {/* CTA — button variant (client-side action) */}
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
