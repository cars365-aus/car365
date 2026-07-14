import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Careers",
  description:
    "We don't have open positions right now, but we're always glad to hear from talented people who want to help Australians buy quality used cars with confidence.",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-card">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Careers at Cars365
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          We&apos;re a small team focused on helping Australians buy quality
          used cars honestly and without the usual pressure. We don&apos;t have
          any open positions advertised at the moment.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          If you&apos;re passionate about that mission and think you could add
          value, we&apos;d still genuinely like to hear from you. Send us a note
          and tell us how you&apos;d like to contribute.
        </p>

        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
