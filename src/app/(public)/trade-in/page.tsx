import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SellTradeForm } from "@/components/leads/sell-trade-form";
import { getPhoneNumbers } from "@/lib/data/settings";
import { getVehicleLeadContext } from "@/lib/data/inventory";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Trade In Your Car",
  description: "Trade in your current car against your next one. Tell us about it and we'll value it for you.",
};

export const revalidate = 3600;

export default async function TradeInPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const { vehicle } = await searchParams;
  const [phones, ctx] = await Promise.all([
    getPhoneNumbers(),
    vehicle ? getVehicleLeadContext(vehicle) : Promise.resolve(null),
  ]);
  const phone = phones.primary || null;
  const whatsappUrl = phones.whatsapp ? buildWhatsAppUrl(phones.whatsapp, "Hi, I'd like to trade in my car.") : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Trade in your car</h1>
          <p className="mt-3 text-body">
            Put your current car towards your next one{ctx ? ` — like the ${ctx.title}` : ""}. Tell us about it and
            we&apos;ll value it for you.
          </p>
        </header>
        <div className="rounded-xl border border-border bg-card p-6">
          <SellTradeForm mode="trade_in" vehicleId={ctx?.id} phone={phone} whatsappUrl={whatsappUrl} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
