import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Press & Media | Hire Car Marketplace",
  description:
    "Press and media enquiries for Hire Car Marketplace, Australia's marketplace for verified independent car rental operators.",
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Press &amp; Media
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          Hire Car Marketplace is an Australian marketplace that connects
          renters with verified, independent car rental operators — with no
          booking fees charged to customers.
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
