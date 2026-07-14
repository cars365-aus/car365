import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Press & Media",
  description:
    "Press and media enquiries for Cars365, an Australian used-car dealership focused on honestly inspected vehicles and transparent pricing.",
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-card">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Press &amp; Media
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          Cars365 is an Australian used-car dealership that sells quality,
          honestly inspected vehicles with transparent pricing, finance, and
          trade-ins — and a team that answers fast.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          For media enquiries, interviews, or to request brand assets, please
          reach out and a member of our team will get back to you.
        </p>

        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contact us for press enquiries <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
