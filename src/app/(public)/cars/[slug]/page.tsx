import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Phone, Eye, Star, MapPin, ChevronRight, Users, Fuel, Settings, Check, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SimilarVehicles } from "@/components/similar-vehicles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/security/auth";
import { getCachedVehicleDetails, getCachedVehicleMetadata } from "@/lib/data/public";
import { EnquiryWidget } from "@/components/enquiry-widget";
import { ImageGallery } from "@/components/image-gallery";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { planHasFeature } from "@/lib/plan-features";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { StickyCtaNotifier } from "@/components/sticky-cta-notifier";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";
import { hashIpForStorage } from "@/lib/security/rate-limit";
import type { Metadata } from "next";
import {
  cityToSlug,
  categoryToSlug,
  vehicleTitle,
  vehicleDescription,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildFaqSchema,
  serializeSchemas,
} from "@/lib/seo";
import { resolveGalleryImages, buildStorageUrl, getVehicleImages } from "@/lib/image-utils";

export const revalidate = 3600; // Cache for 1 hour at edge (ISR)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedVehicleMetadata(slug);

  if (!data) return {};

  type BranchMeta = { city: string; state: string };
  type ImageRecord = { storage_path: string; approved: boolean; sort_order: number };
  const branch = data.branches as unknown as BranchMeta | null;
  const title = vehicleTitle(data.title, branch?.city);
  const description = vehicleDescription({
    year: data.year,
    make: data.make,
    model: data.model,
    category: data.category,
    pricePerDayAud: data.price_per_day_aud,
    city: branch?.city,
    state: branch?.state,
  });

  const images = (data.vehicle_images as unknown as { storage_path: string; approved: boolean; sort_order: number }[]) ?? [];
  const firstApproved = images
    .filter((img) => img.approved)
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ogImage = firstApproved
    ? buildStorageUrl(supabaseUrl, firstApproved)
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    alternates: { canonical: `/cars/${slug}` },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const data = await getCachedVehicleDetails(slug);
  
  if (!data) {
    notFound();
  }

  const { vehicle, vendorSub, reviews } = data;
  const supabase = createAdminClient();



  // Get user for enquiry widget auth state
  const user = await getCurrentUser();
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();
    if (profile) {
      userProfile = {
        name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      };
    }
  }

  // Log view (non-blocking)
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
    const ipHash = hashIpForStorage(ip);
    await supabase.rpc("increment_vehicle_view", {
      p_vehicle_id: vehicle.id,
      p_ip_hash: ipHash,
      p_user_id: user?.id || null,
    });
  } catch (err) {
    console.error("Failed to log view:", err);
  }

  // Cast related records
  type OrgRecord = { id: string; name: string; slug: string; status: string; verified_at: string | null };
  type BranchRecord = { name: string; city: string; state: string; status: string; phone: string | null; whatsapp: string | null };
  type ImageRecord = { id: string; storage_path: string; alt_text: string | null; sort_order: number; approved: boolean };
  type FeatureRecord = { feature: string };

  const org = vehicle.organizations as unknown as OrgRecord;
  const branch = vehicle.branches as unknown as BranchRecord;
  const dbImages = (vehicle.vehicle_images as unknown as ImageRecord[]) || [];
  const features = (vehicle.vehicle_features as unknown as FeatureRecord[]) || [];

  // Determine whether this vendor's plan unlocks direct contact (WhatsApp/phone).
  // Free Starter vendors rely on the on-platform enquiry form; Growth/Pro unlock
  // direct contact buttons. This matches what the pricing page sells.
  const directContactEnabled = planHasFeature(vendorSub?.plan_code, "directContact");

  // Build gallery images using the central helper.
  // getVehicleImages maps database images, custom fields, and handles fallbacks.
  const images = getVehicleImages(vehicle);

  const safeReviews = reviews ?? [];
  const averageRating = safeReviews.length
    ? (safeReviews.reduce((acc, rev) => acc + rev.rating, 0) / safeReviews.length).toFixed(1)
    : null;

  const citySlug = branch?.city ? cityToSlug(branch.city) : null;
  const categorySlug = categoryToSlug(vehicle.category);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    ...(citySlug && branch?.city
      ? [{ name: branch.city, path: `/locations/${citySlug}` }]
      : []),
    ...(citySlug && branch?.city
      ? [{ name: vehicle.category, path: `/locations/${citySlug}/${categorySlug}` }]
      : []),
    { name: vehicle.title, path: `/cars/${vehicle.slug}` },
  ];

  const jsonLd = [
    buildBreadcrumbSchema(breadcrumbItems),
    buildProductSchema({
      name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      description: vehicleDescription({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        pricePerDayAud: vehicle.price_per_day_aud,
        city: branch?.city,
        state: branch?.state,
      }),
      slug: vehicle.slug,
      imageUrl: images[0]?.url,
      pricePerDayAud: vehicle.price_per_day_aud,
      vendorName: org?.name ?? "Hire Car Vendor",
      city: branch?.city,
      state: branch?.state,
      rating: averageRating
        ? { value: Number(averageRating), count: safeReviews.length }
        : undefined,
    }),
    buildFaqSchema([
      {
        question: `What is the daily rental price for the ${vehicle.make} ${vehicle.model}?`,
        answer: `The ${vehicle.year} ${vehicle.make} ${vehicle.model} is available for $${vehicle.price_per_day_aud} per day.`,
      },
      {
        question: `Where can I pick up the ${vehicle.make} ${vehicle.model}?`,
        answer: `This vehicle is available for pickup at ${org?.name} in ${branch?.city}, ${branch?.state}.`,
      },
    ]),
  ];

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(jsonLd) }}
      />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:pb-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ScrollIndicator gradientColor="#f8fafc">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-medium overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <Link href="/locations" className="hover:text-foreground transition-colors">Locations</Link>
          {branch?.city && citySlug && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <Link href={`/locations/${citySlug}`} className="hover:text-foreground transition-colors">
                {branch.city}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <Link
                href={`/locations/${citySlug}/${categorySlug}`}
                className="hover:text-foreground transition-colors"
              >
                {vehicle.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-bold truncate max-w-[200px]">{vehicle.title}</span>
          </nav>
        </ScrollIndicator>

        {/* Image Gallery */}
        <Card variant="elevated" className="mb-8 overflow-hidden">
          <div className="vehicle-gallery-frame aspect-[16/7] md:aspect-[24/9] w-full relative">
            <ImageGallery images={images} />
          </div>
        </Card>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT: Main content */}
          <div className="space-y-6">
            {/* Title & Details */}
            <Card variant="elevated">
              <CardContent className="p-6 md:p-8">
                {/* Category badge + title */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <Badge variant="info" className="uppercase tracking-wider text-xs font-bold">
                      {vehicle.category}
                    </Badge>
                    <h1 className="mt-3 text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight" style={{ letterSpacing: "var(--tracking-heading-lg, -0.03em)" }}>
                      {vehicle.title}
                    </h1>

                    {/* Vendor / Rating / Location / Views */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <Link
                        href={`/vendors/${org?.slug}`}
                        className="flex items-center gap-1.5 font-medium text-foreground/80 hover:text-primary transition-colors"
                      >
                        {org?.name}
                        {org?.verified_at && (
                          <BadgeCheck className="h-4 w-4 text-emerald-500" />
                        )}
                      </Link>
                      {averageRating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-foreground/80">{averageRating}</span>
                          <span className="text-muted-foreground">({safeReviews.length} review{safeReviews.length !== 1 ? "s" : ""})</span>
                        </span>
                      )}
                      {branch?.city && (
                        <Link
                          href={`/locations/${citySlug}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {branch.city}, {branch.state}
                        </Link>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {vehicle.views_count} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* LLM / GEO Search Table (Visually hidden) */}
                <div className="sr-only" aria-hidden="false">
                  <table aria-label="Vehicle Specifications">
                    <tbody>
                      <tr><th>Make</th><td>{vehicle.make}</td></tr>
                      <tr><th>Model</th><td>{vehicle.model}</td></tr>
                      <tr><th>Year</th><td>{vehicle.year}</td></tr>
                      <tr><th>Price</th><td>${vehicle.price_per_day_aud} AUD per day</td></tr>
                      <tr><th>Location</th><td>{branch?.city}, {branch?.state}</td></tr>
                      <tr><th>Seller</th><td>{org?.name}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                  {[
                    { label: "Seats", value: `${vehicle.seats} seats`, icon: Users },
                    { label: "Fuel", value: vehicle.fuel, icon: Fuel },
                    { label: "Transmission", value: vehicle.transmission, icon: Settings },
                    { label: "Branch", value: branch?.city || "—", icon: MapPin },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center rounded-lg bg-muted p-4 text-center">
                      <Icon className="h-5 w-5 text-primary mb-2" strokeWidth={1.5} />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-semibold text-foreground truncate w-full">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distance Limits */}
            <Card variant="default">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Distance Included</h3>
                </div>
                {vehicle.daily_distance_limit_km ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{vehicle.daily_distance_limit_km} km</span> per day. 
                    {vehicle.extra_distance_fee_aud && ` $${vehicle.extra_distance_fee_aud} / km fee for additional distance.`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Unlimited kilometers</span> included in this rental.</p>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Features */}
            {features.length > 0 && (
              <Card variant="default">
                <CardContent className="p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Features & Extras</h2>
                  <div className="flex flex-wrap gap-2">
                    {features.map(({ feature }) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2 text-sm font-medium text-foreground"
                      >
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pickup Location */}
            {branch && (
              <Card variant="default">
                <CardContent className="p-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Pickup Location</h2>
                  <div className="flex items-start gap-3 rounded-lg bg-muted border border-border p-4">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{branch.name}</p>
                      <p className="text-sm text-muted-foreground">{branch.city}, {branch.state}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Card variant="default" className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent className="p-6 flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200 font-medium">
                  Hire Car is a discovery platform. Booking, payment, deposit, insurance, vehicle condition, and rental agreement terms are confirmed directly between you and the vendor.
                </p>
              </CardContent>
            </Card>

            {/* Reviews section removed in the used-car pivot (customer-submitted
                reviews replaced by admin-managed testimonials). This whole VDP is
                rewritten against the new schema in Phase 3. */}
          </div>

          {/* RIGHT: Sticky sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit scroll-mt-[120px]" id="enquiry-section">
            {/* Pricing Panel */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Price per day</p>
                  <p className="text-4xl font-black text-foreground leading-none">${vehicle.price_per_day_aud}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">AUD / day</p>
                </div>
                {vehicle.instant_book && (
                  <Badge variant="success" className="mx-auto mt-3 flex w-fit">
                    Instant Book Available
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Enquiry Form */}
            <Card variant="elevated" className="overflow-hidden">
              <EnquiryWidget
                vehicleId={vehicle.id}
                vendorId={vehicle.organization_id}
                isLoggedIn={!!user}
                userProfile={userProfile}
                instantBook={vehicle.instant_book}
              />
            </Card>

            {/* Vendor Contact Widget */}
            <Card variant="default">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Listed by</p>
                <Link
                  href={`/vendors/${org?.slug}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {org?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {org?.name}
                      {org?.verified_at && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                    </p>
                    {branch?.city && (
                      <p className="text-xs text-muted-foreground">{branch.city}, {branch.state}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
                {directContactEnabled && (branch?.phone || branch?.whatsapp) && (
                  <div className="mt-4 space-y-2 pt-4 border-t border-border">
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex items-center justify-center gap-2 w-full"
                      >
                        <Button variant="outline" size="cta" className="w-full">
                          <Phone className="h-4 w-4" />
                          Call vendor
                        </Button>
                      </a>
                    )}
                    {branch.whatsapp && (
                      <WhatsAppButton
                        phone={branch.whatsapp}
                        vehicleId={vehicle.id}
                        vendorId={vehicle.organization_id}
                        message={`Hi ${org?.name ?? "there"}, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model} ($${vehicle.price_per_day_aud}/day) listed on Hire Car. Is it available?`}
                        className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors h-11"
                      >
                        WhatsApp vendor
                      </WhatsAppButton>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust badges */}
            <Card variant="default">
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Why Hire Car</p>
                <ul className="space-y-2.5">
                  {[
                    "Verified vendor listings",
                    "No booking fees or hidden charges",
                    "Direct contact with operator",
                    "Australia-wide coverage",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground/80 font-medium">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
        
        {branch?.city && (
          <SimilarVehicles 
            currentVehicleId={vehicle.id} 
            city={branch.city} 
            category={vehicle.category} 
            make={vehicle.make} 
          />
        )}
      </main>

      {/* Mobile Sticky Bottom CTA */}
      <StickyCtaNotifier />
      <div className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky-cta,50)] bg-card border-t border-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:hidden flex items-center justify-between pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div>
          <p className="text-2xl font-black text-foreground">${vehicle.price_per_day_aud}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AUD / day</p>
        </div>
        <a href="#enquiry-section">
          <Button size="cta" className="min-w-[160px]">
            {vehicle.instant_book ? "Instant Book" : "Enquire Now"}
          </Button>
        </a>
      </div>

      <SiteFooter />
    </div>
  );
}
