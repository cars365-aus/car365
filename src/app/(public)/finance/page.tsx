import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FinancePanels } from "@/components/finance-panels";
import { getFinanceParams, getPhoneNumbers } from "@/lib/data/settings";
import { getVehicleLeadContext } from "@/lib/data/inventory";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/finance",
  title: "Car Finance Australia — Estimate Your Repayments",
  description:
    "Estimate weekly repayments with our car finance calculator and enquire about competitive Australian car finance. Indicative only, not an offer of finance.",
  keywords: ["car finance Australia", "used car loan NSW", "car repayment calculator"],
});

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
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Car finance made simple</h1>
          <p className="mt-3 text-body">
            Estimate your weekly repayments, then send us an enquiry and our finance partner will help you get
            competitive finance{ctx ? ` on the ${ctx.title}` : ""}.
          </p>
        </header>

        <FinancePanels
          params={params}
          price={ctx?.price ?? 30000}
          vehicleId={ctx?.id}
          phone={phone}
          whatsappUrl={whatsappUrl}
        />
      </main>
      <SiteFooter />
    </>
  );
}
