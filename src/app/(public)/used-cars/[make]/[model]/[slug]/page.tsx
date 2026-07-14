import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck, BadgeCheck, Handshake, CircleDollarSign } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleCard } from "@/components/vehicle-card";
import { GatedPrice } from "@/components/auth/gated-price";
import { VdpLeadActions } from "@/components/leads/vdp-lead-actions";
import { FinanceCalculator } from "@/components/finance-calculator";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/data/inventory";
import { getFinanceParams, getPhoneNumbers, getCompanyProfile } from "@/lib/data/settings";
import { resolveRedirect } from "@/lib/data/redirects";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { JsonLd } from "@/components/json-ld";
import { vehicleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import {
  BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, DRIVE_LABELS,
  formatKm,
} from "@/lib/nav";
import type { VehicleImage } from "@/lib/domain";

export const revalidate = 900;

type Params = { make: string; model: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Vehicle not found" };
  const title = v.seoTitle || `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""} for Sale – ${formatKm(v.mileageKm)}`;
  return {
    title,
    description: v.seoDescription || (v.description ?? "").slice(0, 160),
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<Params> }) {
  const { make, model, slug } = await params;
  const [v, financeParams, phones, company] = await Promise.all([
    getVehicleBySlug(slug),
    getFinanceParams(),
    getPhoneNumbers(),
    getCompanyProfile(),
  ]);
  if (!v) {
    // Sold cars are archived 60 days after sale with a 301 to the model page.
    const rule = await resolveRedirect(`/used-cars/${make}/${model}/${slug}`);
    if (rule && rule.code !== 410) permanentRedirect(rule.toPath);
    notFound();
  }

  const similar = await getSimilarVehicles({ id: v.id, bodyType: v.bodyType, price: v.price });
  const title = `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""}`;

  const sellerName = (company.trading_name as string) || "Cars365";
  const vdpPath = `/used-cars/${v.makeSlug}/${v.modelSlug}/${v.slug}`;
  const jsonLd = [
    vehicleSchema(v, { path: vdpPath, sellerName }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Used Cars", path: "/used-cars" },
      { name: v.makeName, path: `/used-cars/${v.makeSlug}` },
      { name: v.modelName, path: `/used-cars/${v.makeSlug}/${v.modelSlug}` },
      { name: title, path: vdpPath },
    ]),
  ];

  const galleryImages: VehicleImage[] =
    v.images.length > 0
      ? v.images
      : [{ id: "cover", url: v.coverImageUrl ?? "", altText: v.coverImageAlt, sortOrder: 0, isCover: true }];

  const phone = phones.primary || null;
  const whatsapp = phones.whatsapp || null;
  const waMessage = `Hi, I'm interested in the ${title} (Stock #${v.stockId}).`;
  const isSold = v.status === "sold";

  const specs: { label: string; value: string | null }[] = [
    { label: "Kilometres", value: formatKm(v.mileageKm) },
    { label: "Year", value: String(v.year) },
    { label: "Transmission", value: TRANSMISSION_LABELS[v.transmission] },
    { label: "Fuel", value: FUEL_LABELS[v.fuelType] },
    { label: "Body", value: BODY_TYPE_LABELS[v.bodyType] },
    { label: "Drive", value: v.driveType ? DRIVE_LABELS[v.driveType] : null },
    { label: "Engine", value: v.engine },
    { label: "Colour", value: v.exteriorColor },
  ];

  const featureGroups = (["safety", "comfort", "technology", "exterior"] as const)
    .map((cat) => ({ cat, items: v.features.filter((f) => f.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd schema={jsonLd} />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span aria-hidden>/</span>
          <Link href="/used-cars" className="hover:text-foreground">Used Cars</Link><span aria-hidden>/</span>
          <Link href={`/used-cars/${v.makeSlug}`} className="hover:text-foreground">{v.makeName}</Link><span aria-hidden>/</span>
          <Link href={`/used-cars/${v.makeSlug}/${v.modelSlug}`} className="hover:text-foreground">{v.modelName}</Link><span aria-hidden>/</span>
          <span className="text-foreground">{v.year} {v.variant ?? v.modelName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <VehicleGallery images={galleryImages} title={title} />

            {isSold ? (
              <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">
                This car has been sold. <Link href="/used-cars" className="font-semibold underline">See similar cars</Link>.
              </div>
            ) : null}

            {/* Spec grid */}
            <section className="mt-8">
              <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Key specifications</h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-foreground">{s.value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Features */}
            {featureGroups.length > 0 ? (
              <section className="mt-8">
                <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Features</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {featureGroups.map((g) => (
                    <div key={g.cat}>
                      <h3 className="mb-2 text-sm font-semibold capitalize text-foreground">{g.cat}</h3>
                      <ul className="space-y-1.5">
                        {g.items.map((f) => (
                          <li key={f.id} className="flex items-center gap-2 text-sm text-body">
                            <BadgeCheck className="size-4 text-success" />{f.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Description */}
            {v.description ? (
              <section className="mt-8">
                <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Description</h2>
                <p className="whitespace-pre-line leading-relaxed text-body">{v.description}</p>
              </section>
            ) : null}

            {/* Condition & inspection */}
            <section className="mt-8 rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Buy with confidence</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {v.roadworthyIncluded ? (
                  <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />Roadworthy certificate included</li>
                ) : null}
                {v.warrantyText ? (
                  <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />{v.warrantyText}</li>
                ) : null}
                {v.inspectionAvailable ? (
                  <li className="flex items-center gap-2 text-sm text-body"><BadgeCheck className="size-5 text-success" />Inspection available</li>
                ) : null}
                {v.financeAvailable ? (
                  <li className="flex items-center gap-2 text-sm text-body"><CircleDollarSign className="size-5 text-success" />Finance can be arranged</li>
                ) : null}
                {v.tradeInWelcome ? (
                  <li className="flex items-center gap-2 text-sm text-body"><Handshake className="size-5 text-success" />Trade-ins welcome</li>
                ) : null}
                {v.safetyRating ? (
                  <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />{v.safetyRating}</li>
                ) : null}
              </ul>
            </section>
          </div>

          {/* Sticky enquiry card (desktop) */}
          <aside className="lg:relative">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h1 className="font-heading text-2xl font-bold leading-tight text-foreground">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Stock #{v.stockId}</p>

                <GatedPrice price={v.price} previousPrice={v.previousPrice} />

                {!isSold ? (
                  <div className="mt-5">
                    <VdpLeadActions
                      vehicleId={v.id}
                      vehicleTitle={title}
                      price={v.price}
                      phone={phone}
                      whatsappUrl={whatsapp ? buildWhatsAppUrl(whatsapp, waMessage) : null}
                      showInspection={v.inspectionAvailable}
                      showFinance={v.financeAvailable}
                      showTradeIn={v.tradeInWelcome}
                      variant="card"
                    />
                  </div>
                ) : (
                  <Link href="/used-cars" className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary-hover">
                    See similar cars
                  </Link>
                )}

                {v.financeAvailable ? (
                  <FinanceCalculator price={v.price} params={financeParams} />
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar */}
        {similar.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Similar cars</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => <VehicleCard key={s.id} vehicle={s} />)}
            </div>
          </section>
        ) : null}
      </main>

      {/* Sticky mobile CTA bar */}
      {!isSold ? (
        <div className="sticky bottom-0 z-40 border-t border-border bg-card px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <VdpLeadActions
            vehicleId={v.id}
            vehicleTitle={title}
            price={v.price}
            phone={phone}
            whatsappUrl={whatsapp ? buildWhatsAppUrl(whatsapp, waMessage) : null}
            variant="sticky"
          />
        </div>
      ) : null}

      <SiteFooter />
    </>
  );
}
