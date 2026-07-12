import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, MessageCircle, Mail, ShieldCheck, BadgeCheck, Handshake, CircleDollarSign } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleCard } from "@/components/vehicle-card";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/data/inventory";
import { getFinanceParams, getPhoneNumbers } from "@/lib/data/settings";
import { estimateRepayments } from "@/lib/finance";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, DRIVE_LABELS,
  formatPrice, formatKm,
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
  const { slug } = await params;
  const [v, financeParams, phones] = await Promise.all([
    getVehicleBySlug(slug),
    getFinanceParams(),
    getPhoneNumbers(),
  ]);
  if (!v) notFound();

  const similar = await getSimilarVehicles({ id: v.id, bodyType: v.bodyType, price: v.price });
  const title = `${v.year} ${v.makeName} ${v.modelName}${v.variant ? ` ${v.variant}` : ""}`;
  const weekly = v.weeklyEstimate ?? estimateRepayments(v.price, financeParams).weekly;

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

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-extrabold tabular-nums text-foreground">{formatPrice(v.price)}</span>
                  {v.previousPrice && v.previousPrice > v.price ? (
                    <span className="text-lg text-muted-foreground line-through tabular-nums">{formatPrice(v.previousPrice)}</span>
                  ) : null}
                </div>
                {v.financeAvailable ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    or approx <span className="font-semibold text-body tabular-nums">{formatPrice(weekly)}/week</span>*
                  </p>
                ) : null}

                {!isSold ? (
                  <div className="mt-5 space-y-2">
                    {phone ? (
                      <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary-hover">
                        <Phone className="size-5" /> Call {phone}
                      </a>
                    ) : null}
                    {whatsapp ? (
                      <a href={buildWhatsAppUrl(whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 font-semibold text-white hover:opacity-90">
                        <MessageCircle className="size-5" /> WhatsApp
                      </a>
                    ) : null}
                    <Link href="/contact" className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold text-foreground hover:bg-muted">
                      <Mail className="size-5" /> Enquire
                    </Link>
                  </div>
                ) : (
                  <Link href="/used-cars" className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary-hover">
                    See similar cars
                  </Link>
                )}

                {v.financeAvailable ? (
                  <p className="mt-4 text-xs text-muted-foreground">{financeParams.disclaimer}</p>
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
        <div className="sticky bottom-0 z-40 flex gap-2 border-t border-border bg-card p-3 lg:hidden">
          {phone ? (
            <a href={`tel:${phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground">
              <Phone className="size-4" /> Call
            </a>
          ) : null}
          {whatsapp ? (
            <a href={buildWhatsAppUrl(whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2.5 text-sm font-semibold text-white">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          ) : null}
          <Link href="/contact" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-foreground">
            <Mail className="size-4" /> Enquire
          </Link>
        </div>
      ) : null}

      <SiteFooter />
    </>
  );
}
