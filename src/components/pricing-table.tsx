"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

// --- Plan data types ---

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PricingPlan {
  id: "basic" | "pro" | "premium";
  name: string;
  monthlyPrice: number;
  vehicleLimit: number | null;
  badge?: string;
  features: PlanFeature[];
}

// --- Static plan data per spec requirements 4.6, 4.7, 4.8 ---

const PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Starter",
    monthlyPrice: 0,
    vehicleLimit: 5,
    features: [
      { label: "5 vehicle listings", included: true },
      { label: "Vendor profile page", included: true },
      { label: "Inquiry form leads", included: true },
      { label: "Email lead notifications", included: true },
      { label: "WhatsApp click button", included: false },
      { label: "Phone click tracking", included: false },
      { label: "Analytics dashboard", included: false },
      { label: "Featured placement", included: false },
      { label: "AI SEO content", included: false },
      { label: "Email support", included: true },
    ],
  },
  {
    id: "pro",
    name: "Growth",
    monthlyPrice: 49,
    vehicleLimit: 20,
    badge: "Most Popular - Best Value",
    features: [
      { label: "20 vehicle listings", included: true },
      { label: "Vendor profile page", included: true },
      { label: "Inquiry form leads", included: true },
      { label: "Email lead notifications", included: true },
      { label: "WhatsApp click button", included: true },
      { label: "Phone click tracking", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "Featured placement", included: true },
      { label: "AI SEO content", included: false },
      { label: "Priority email + Phone support", included: true },
    ],
  },
  {
    id: "premium",
    name: "Pro",
    monthlyPrice: 99,
    vehicleLimit: 50,
    features: [
      { label: "50 vehicle listings", included: true },
      { label: "Vendor profile page", included: true },
      { label: "Inquiry form leads", included: true },
      { label: "Email lead notifications", included: true },
      { label: "WhatsApp click button", included: true },
      { label: "Phone click tracking", included: true },
      { label: "Advanced analytics dashboard", included: true },
      { label: "Featured placement", included: true },
      { label: "AI SEO content generation", included: true },
      { label: "Dedicated Phone, Priority Email, Account Manager, Same-Day Response", included: true },
    ],
  },
];

// --- Utility ---

/**
 * Calculate annual price with 10% discount: monthlyPrice × 12 × 0.9
 */
export function calculateAnnualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.9 * 100) / 100;
}

/**
 * Format price for display with comma separators, stripping trailing .00
 */
function formatPrice(price: number): string {
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted.replace(/\.00$/, "");
}

// --- Component ---

export function PricingTable() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="w-full">
      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              !isAnnual
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={!isAnnual}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              isAnnual
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={isAnnual}
          >
            Annual
          </button>
        </div>
        <span className="text-sm font-medium text-primary">
          Save 10% annually
        </span>
      </div>

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isPro = plan.id === "pro";
          const price = isAnnual
            ? calculateAnnualPrice(plan.monthlyPrice)
            : plan.monthlyPrice;
          const period = isAnnual ? "/year" : "/month";

          return (
            <div 
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isPro && "scale-[1.02] md:scale-105 z-10"
              )}
            >
              {/* "Most Popular - Best Value" badge for Pro */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge variant="default" className="whitespace-nowrap px-3 py-1 text-xs shadow-md">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <Card
                variant={isPro ? "elevated" : "default"}
                className={cn(
                  "flex-1 flex flex-col h-full",
                  isPro && "border-2 border-primary shadow-lg"
                )}
              >
                <CardHeader className="pt-6">
                <CardTitle className="text-xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>

                {/* "14-day free trial" badge */}
                <Badge variant="success" className="mt-2 w-fit">
                  14-day free trial
                </Badge>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    ${formatPrice(price)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {period}
                  </span>
                </div>

                {/* "No credit card required" */}
                <p className="mt-2 text-xs text-muted-foreground font-medium">
                  No credit card required
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1" role="list">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground line-through"
                      )}
                    >
                      {feature.included ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-4 w-4 shrink-0 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                      )}
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href={`/auth/sign-in?plan=${plan.id}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "cta" }),
                    "w-full"
                  )}
                >
                  Start Free - {plan.name}
                </Link>

                {/* Microcopy within 48px below CTA */}
                <p className="mt-3 text-center text-xs text-muted-foreground leading-relaxed">
                  14-day trial · No credit card required · Cancel anytime
                </p>
              </CardContent>
            </Card>
            </div>
          );
        })}
      </div>

      {/* Note about upgrading */}
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Start with the plan that fits your fleet size. You can upgrade anytime as
        your business grows.
      </p>
    </div>
  );
}
