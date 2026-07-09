import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Success Stories | Hire Car Marketplace",
  description:
    "Hire Car Marketplace helps independent Australian rental operators reach more customers with zero booking fees. Become one of our featured operators.",
};

const operatorBenefits = [
  "Reach customers searching across Australia",
  "Direct enquiries — no middleman booking fees",
  "Verified operator badge to build trust",
  "A dashboard with leads and listing analytics",
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Success Stories
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          We&apos;re a growing marketplace built to help independent Australian
          car rental operators win more business directly — without paying
          marketplace booking fees. As our operator community grows, we&apos;ll
          share their stories here.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Want to be one of the first operators we feature? Here&apos;s what
          listing with us gives you:
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {operatorBenefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-medium text-slate-700">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/for-vendors"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            List your fleet free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
          >
            Talk to our team
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
