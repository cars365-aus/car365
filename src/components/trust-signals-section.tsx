"use client";

import { TrustBadge } from "./trust-badge";
import { Car, BadgeCheck, Receipt, MapPin, Zap } from "lucide-react";

const trustSignals = [
  {
    icon: BadgeCheck,
    title: "Best price guaranteed",
    description: "Compare and save with verified local operators. No hidden fees or surprises.",
  },
  {
    icon: Car,
    title: "Premium vehicle fleet",
    description: "From economy to luxury, all vehicles maintained to high standards by local operators.",
  },
  {
    icon: Receipt,
    title: "No hidden fees",
    description: "Transparent pricing. What you see is what you pay. Full cost breakdown upfront.",
  },
  {
    icon: MapPin,
    title: "Local Australian businesses",
    description: "Support verified independent rental operators across Australia. Real people, real service.",
  },
  {
    icon: Zap,
    title: "Instant confirmation",
    description: "Book directly with vendors. No waiting, no middleman fees. Get on the road faster.",
  },
];

export function TrustSignalsSection() {
  return (
    <section className="py-16 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why rent with Hire Car?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We connect you directly with verified local rental operators. 
            No middlemen, no surprises.
          </p>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {trustSignals.map((signal, index) => (
            <TrustBadge
              key={index}
              icon={signal.icon}
              title={signal.title}
              description={signal.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}