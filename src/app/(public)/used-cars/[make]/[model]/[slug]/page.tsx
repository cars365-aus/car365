import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck, BadgeCheck, Handshake, CircleDollarSign } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleCard } from "@/components/vehicle-card";
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
  formatKm, formatPrice,
} from "@/lib/nav";
import type { VehicleImage } from "@/lib/domain";

export const revalidate = 900;

type Params = { make: string; model: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Vehicle not found" };
  const title = `${v.year ?? "Car"} ${v.makeName ?? ""} ${v.modelName ?? ""}${v.variant ? ` ${v.variant}` : ""} for Sale | Cars365`.trim();
  
  const baseDesc = `Looking for a ${v.year ?? "Car"} ${v.makeName ?? ""} ${v.modelName ?? ""}? ${v.mileageKm != null ? formatKm(v.mileageKm) : "Great condition"}${v.transmission ? `, ${TRANSMISSION_LABELS[v.transmission]}` : ""}${v.fuelType ? `, ${FUEL_LABELS[v.fuelType]}` : ""}.`.replace(/\s+/g, " ");
  const extraDesc = v.description ? ` ${(v.description).slice(0, 80)}...` : " Inspected and ready to drive away.";
  
  return {
    title,
    description: `${baseDesc}${extraDesc} Finance available at Cars365.`,
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
  const title = `${v.year ?? "Car"} ${v.makeName ?? ""} ${v.modelName ?? ""}${v.variant ? ` ${v.variant}` : ""}`.trim();

  const sellerName = (company.trading_name as string) || "Cars365";
  const vdpPath = `/used-cars/${v.makeSlug}/${v.modelSlug}/${v.slug}`;
  const jsonLd = [
    vehicleSchema(v, { path: vdpPath, sellerName }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Used Cars", path: "/used-cars" },
      { name: v.makeName ?? "Used Cars", path: `/used-cars/${v.makeSlug || ""}` },
      { name: v.modelName ?? "Model", path: `/used-cars/${v.makeSlug || ""}/${v.modelSlug || ""}` },
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
    { label: "Kilometres", value: v.mileageKm != null ? formatKm(v.mileageKm) : null },
    { label: "Year", value: v.year != null ? String(v.year) : null },
    { label: "Transmission", value: v.transmission ? TRANSMISSION_LABELS[v.transmission] : null },
    { label: "Fuel", value: v.fuelType ? FUEL_LABELS[v.fuelType] : null },
    { label: "Body", value: v.bodyType ? BODY_TYPE_LABELS[v.bodyType] : null },
    { label: "Drive", value: v.driveType ? DRIVE_LABELS[v.driveType] : null },
    { label: "Engine", value: v.engine },
    { label: "Colour", value: v.exteriorColor },
    { label: "Location", value: "CARS365 Granville" },
  ];

  const featureGroups = (["safety", "comfort", "technology", "exterior"] as const)
    .map((cat) => ({ cat, items: v.features.filter((f) => f.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd schema={jsonLd} />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 lg:pt-12">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link><span aria-hidden>/</span>
          <Link href="/used-cars" className="hover:text-foreground">Used Cars</Link><span aria-hidden>/</span>
          <Link href={`/used-cars/${v.makeSlug || ""}`} className="hover:text-foreground">{v.makeName ?? "Used"}</Link><span aria-hidden>/</span>
          <Link href={`/used-cars/${v.makeSlug || ""}/${v.modelSlug || ""}`} className="hover:text-foreground">{v.modelName ?? "Cars"}</Link><span aria-hidden>/</span>
          <span className="text-foreground">{v.year ?? ""} {v.variant ?? v.modelName ?? ""}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
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
                <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />Roadworthy certificate included</li>
                {v.warrantyText ? (
                  <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />{v.warrantyText}</li>
                ) : null}
                <li className="flex items-center gap-2 text-sm text-body"><BadgeCheck className="size-5 text-success" />Inspection available</li>
                <li className="flex items-center gap-2 text-sm text-body"><CircleDollarSign className="size-5 text-success" />Finance can be arranged</li>
                <li className="flex items-center gap-2 text-sm text-body"><Handshake className="size-5 text-success" />Trade-ins welcome</li>
                {v.safetyRating ? (
                  <li className="flex items-center gap-2 text-sm text-body"><ShieldCheck className="size-5 text-success" />{v.safetyRating}</li>
                ) : null}
              </ul>
            </section>
          </div>

          {/* Sticky enquiry card (desktop) */}
          <aside className="lg:relative">
            <div className="lg:sticky lg:top-[88px]">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h1 className="font-heading text-2xl font-bold leading-tight text-foreground">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Stock #{v.stockId}</p>

                {v.price != null && v.price > 0 ? (
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-extrabold tabular-nums text-foreground">{formatPrice(v.price)}</span>
                      {v.previousPrice && v.previousPrice > v.price ? (
                        <span className="text-lg text-muted-foreground line-through tabular-nums">{formatPrice(v.previousPrice)}</span>
                      ) : null}
                    </div>
                    {v.previousPrice && v.previousPrice > v.price ? (
                      <span className="mt-2 inline-block rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                        Price drop · {formatPrice(v.previousPrice - v.price)} off
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4">
                    <span className="font-heading text-4xl font-extrabold tabular-nums text-foreground">POA</span>
                  </div>
                )}

                {!isSold ? (
                  <div className="mt-5">
                    <VdpLeadActions
                      vehicleId={v.id}
                      vehicleTitle={title}
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

                {v.price && v.price > 0 ? (
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
