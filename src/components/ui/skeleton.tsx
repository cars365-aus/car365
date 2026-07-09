import * as React from "react"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "text" | "circular" | "rectangular"
}

const skeletonVariantStyles: Record<
  NonNullable<SkeletonProps["variant"]>,
  string
> = {
  text: "h-4 w-full rounded",
  circular: "rounded-full aspect-square",
  rectangular: "rounded-lg",
}

function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse-skeleton",
        skeletonVariantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export { Skeleton, type SkeletonProps }
