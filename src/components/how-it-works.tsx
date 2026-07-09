import { MapPin, BarChart3, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/section";

const steps = [
  {
    step: 1,
    icon: MapPin,
    title: "Search by Location",
    description:
      "Search for available vehicles in your area from verified local operators.",
  },
  {
    step: 2,
    icon: BarChart3,
    title: "Compare & Choose",
    description:
      "Compare prices, features, and reviews to find your ideal rental.",
  },
  {
    step: 3,
    icon: MessageCircle,
    title: "Contact & Book",
    description:
      "Reach out directly to the vendor — no middleman, no hidden fees.",
  },
];

export function HowItWorks() {
  return (
    <Section variant="default" size="md" container>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Find your perfect rental in 3 simple steps
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map(({ step, icon: Icon, title, description }) => (
          <div
            key={step}
            className="relative rounded-xl border border-border bg-card p-6 shadow-sm text-center transition-shadow hover:shadow-md"
          >
            {/* Numbered badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
              {step}
            </span>

            {/* Icon container */}
            <div className="mx-auto mt-4 mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>

            {/* Title and description */}
            <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
