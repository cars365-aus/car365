"use client";

import { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "default" | "large" | "compact";
}

export function TrustBadge({ icon: Icon, title, description, variant = "default" }: TrustBadgeProps) {
  if (variant === "large") {
    return (
      <div className="flex flex-col items-center text-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
          <Icon className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-slate-600 max-w-xs">{description}</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 shrink-0">
          <Icon className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-3">
        <Icon className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}