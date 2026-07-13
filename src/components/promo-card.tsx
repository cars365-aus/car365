"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PromoCardProps {
  title: string;
  subtitle: string;
  description?: string;
  ctaText: string;
  ctaHref: string;
  bgImage?: string;
  bgColor?: string;
  variant?: "large" | "medium" | "small";
  discount?: string;
}

export function PromoCard({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  bgImage,
  bgColor = "bg-gradient-to-br from-slate-900 to-slate-800",
  variant = "medium",
  discount,
}: PromoCardProps) {
  const heightClass = variant === "large" ? "min-h-[440px]" : variant === "medium" ? "min-h-[300px]" : "min-h-[220px]";
  const paddingClass = variant === "large" ? "p-10 md:p-14" : variant === "medium" ? "p-8 md:p-10" : "p-6";
  const titleSize = variant === "large" ? "text-4xl md:text-5xl" : variant === "medium" ? "text-3xl md:text-4xl" : "text-2xl";

  return (
    <div className={`
      relative overflow-hidden rounded-[2rem] ${heightClass} ${paddingClass}
      group card-lift ring-1 ring-white/10
      ${!bgImage ? bgColor : ""}
    `}>
      {/* Background Image */}
      {bgImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-end">
        {/* Discount Badge */}
        {discount && (
          <div className="mb-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="inline-block px-4 py-1.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
              {discount}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className={`${titleSize} font-black text-white mb-3 font-heading tracking-tight animate-slide-up`} style={{ animationDelay: '150ms' }}>
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-xl text-white/90 font-medium mb-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {subtitle}
        </p>

        {/* Description */}
        {description && (
          <p className="text-base text-white/70 mb-8 max-w-md animate-slide-up" style={{ animationDelay: '250ms' }}>
            {description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Link
            href={ctaHref}
            className={`
              inline-flex items-center justify-center gap-2 font-bold transition-all duration-300
              rounded-xl backdrop-blur-md border border-white/20
              bg-card/10 text-white hover:bg-card hover:text-slate-950
              ${variant === "large" ? "px-8 py-4 text-lg" : "px-6 py-3 text-base"}
            `}
          >
            {ctaText}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}