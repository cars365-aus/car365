import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPhoneNumbers } from "@/lib/data/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false },
};

const HEADINGS: Record<string, string> = {
  finance: "Thanks — our finance partner will be in touch.",
  inspection: "Inspection requested — we'll confirm your time.",
  sell: "Thanks — we'll come back with an offer.",
  trade_in: "Thanks — we'll value your trade-in.",
};

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const phones = await getPhoneNumbers();
  const phone = phones.primary || null;
  const whatsappUrl = phones.whatsapp ? buildWhatsAppUrl(phones.whatsapp, "Hi, I just submitted an enquiry.") : null;
  const heading = (type && HEADINGS[type]) || "Thanks — we've got your enquiry.";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="size-14 text-success" />
        <h1 className="mt-5 font-heading text-3xl font-bold text-foreground">{heading}</h1>
        <p className="mt-3 text-body">A specialist will contact you shortly — within 15 minutes during business hours.</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {phone ? (
            <a href={`tel:${phone}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 font-semibold text-foreground hover:bg-muted">
              <Phone className="size-4" /> Call {phone}
            </a>
          ) : null}
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-5 py-2.5 font-semibold text-white hover:opacity-90">
              <MessageCircle className="size-4" /> WhatsApp us
            </a>
          ) : null}
        </div>

        <Link href="/used-cars" className="mt-8 text-sm font-semibold text-primary hover:underline">Keep browsing cars →</Link>
      </main>
      <SiteFooter />
    </>
  );
}
