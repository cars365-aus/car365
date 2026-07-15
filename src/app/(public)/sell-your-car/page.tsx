import type { Metadata } from "next";
import Link from "next/link";
import { Camera, PhoneCall, BadgeDollarSign } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SellTradeForm } from "@/components/leads/sell-trade-form";
import { getPhoneNumbers } from "@/lib/data/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Sell Your Car — Fast, Fair Offers",
  description: "Sell your car to us the easy way. Tell us a few details and we'll come back with a fair offer — no obligation.",
};

export const revalidate = 3600;

const STEPS = [
  { icon: Camera, title: "Tell us about it", body: "Share a few details about your car — it takes a minute." },
  { icon: PhoneCall, title: "We review & call", body: "Our team reviews it and calls you to confirm the details." },
  { icon: BadgeDollarSign, title: "Get a fair offer", body: "We make you a fair offer and can pay you fast." },
];

export default async function SellYourCarPage() {
  const phones = await getPhoneNumbers();
  const phone = phones.primary || null;
  const whatsappUrl = phones.whatsapp ? buildWhatsAppUrl(phones.whatsapp, "Hi, I'd like to sell my car.") : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Sell your car the easy way</h1>
          <p className="mt-3 text-body">No strangers at your home, no haggling. Tell us about your car and we&apos;ll come back with a fair offer.</p>
        </header>

        <div className="mb-10 rounded-xl bg-primary/10 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Want to list it yourself?</h3>
            <p className="text-sm text-body">Create a Seller account to list your own vehicles directly on our peer-to-peer marketplace.</p>
          </div>
          <Link href="/account" className="inline-flex h-11 flex-none items-center justify-center rounded-lg bg-primary px-6 font-bold text-black transition-colors hover:bg-primary-hover shadow-lg shadow-primary/20">
            Sign up as a Seller
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <ol className="space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <div className="flex size-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-primary">Step {i + 1}</p>
                    <h3 className="font-heading text-lg font-bold text-foreground">{s.title}</h3>
                    <p className="text-sm text-body">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Get your offer</h2>
            <SellTradeForm mode="sell" phone={phone} whatsappUrl={whatsappUrl} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
