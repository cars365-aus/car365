"use client";

import { LucideIcon } from "lucide-react";

interface StepCardProps {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast?: boolean;
}

export function StepCard({ step, icon: Icon, title, description, isLast = false }: StepCardProps) {
  return (
    <div className="relative flex gap-4 md:block">
      {/* Connector Line (Desktop) */}
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-slate-200 -translate-x-0" />
      )}

      {/* Step Number & Icon */}
      <div className="relative shrink-0 md:mx-auto md:mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 z-10 relative">
          <Icon className="h-7 w-7" />
        </div>
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white text-xs font-bold">
          {step}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 md:text-center md:pb-0">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>

      {/* Connector Line (Mobile) */}
      {!isLast && (
        <div className="md:hidden absolute left-8 top-16 bottom-0 w-0.5 bg-slate-200" />
      )}
    </div>
  );
}