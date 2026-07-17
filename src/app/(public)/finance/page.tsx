import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FinanceCalculator } from "@/components/finance-calculator";
import { FinanceForm } from "@/components/leads/finance-form";
import { getFinanceParams, getPhoneNumbers } from "@/lib/data/settings";
import { getVehicleLeadContext } from "@/lib/data/inventory";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Car Finance — Estimate Your Repayments",
  description: "Estimate weekly repayments with our finance calculator and enquire about competitive car finance. Indicative only, not an offer of finance.",
};

export const revalidate = 300;

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const { vehicle } = await searchParams;
  const [params, phones, ctx] = await Promise.all([
    getFinanceParams(),
    getPhoneNumbers(),
    vehicle ? getVehicleLeadContext(vehicle) : Promise.resolve(null),
  ]);
  const phone = phones.primary || null;
  const whatsappUrl = phones.whatsapp ? buildWhatsAppUrl(phones.whatsapp, "Hi, I'd like to talk about car finance.") : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Car finance made simple</h1>
          <p className="mt-3 text-body">
            Estimate your weekly repayments, then send us an enquiry and our finance partner will help you get
            competitive finance{ctx ? ` on the ${ctx.title}` : ""}.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <FinanceCalculator params={params} price={ctx?.price ?? 30000} />
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-bold text-foreground">Enquire about finance</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">A specialist will contact you — no obligation.</p>
            <FinanceForm vehicleId={ctx?.id} phone={phone} whatsappUrl={whatsappUrl} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
