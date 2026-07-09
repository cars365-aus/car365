import { notFound } from "next/navigation";
import Link from "next/link";

import type { Metadata } from "next";
import {
  Car,
  Star,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  MessageSquare,
  User,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { VendorProfileHeader } from "@/components/vendor-profile-header";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/lib/types";
import { buildOrganizationSchema, serializeSchemas } from "@/lib/seo";
import { resolveVehicleImage } from "@/lib/image-utils";
import type { VehicleImageRecord } from "@/lib/image-utils";

// ── Types ──────────────────────────────────────────────────────────────────
type Branch = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
};

type VendorData = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  verified: boolean;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  branches: Branch[];
  vehicleCount: number;
  averageRating: number | null;
  reviewCount: number;
  reviews: { id: string; customer_name: string; rating: number; body: string; created_at: string }[];
};

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("name, branches(city, state, status)")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!data) return {};
  const branches = (data.branches as unknown as Branch[]) ?? [];
  const firstApprovedBranch = branches.find((branch) => branch.status === "approved");
  const location = firstApprovedBranch
    ? ` in ${firstApprovedBranch.city}, ${firstApprovedBranch.state}`
    : "";

  return {
    title: `${data.name} - Car Rental${location}`,
    description: `Verified car rental operator${location}. Browse their fleet on Hire Car Marketplace.`,
  };
}

// ── Data fetching ──────────────────────────────────────────────────────────
async function getVendor(slug: string): Promise<VendorData | null> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(`
      id, name, slug, status, billing_email, website, phone, created_at,
      branches(id, name, city, state, status)
    `)
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!org) return null;

  // Count vehicles
  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("status", "approved");

  // Aggregate reviews
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, body, created_at")
    .eq("organization_id", org.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const reviewCount = reviewData?.length ?? 0;
  const averageRating =
    reviewCount > 0
      ? reviewData!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  // Get approved branches
  const branches = (org.branches as Branch[]).filter((b) => b.status === "approved");

  // Use branch city/state if no profile city
  const firstBranch = branches[0];
  const city = firstBranch?.city ?? "";
  const state = firstBranch?.state ?? "";

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    city,
    state,
    verified: true, // Passed status === approved check
    description: null,
    phone: org.phone ?? null,
    email: org.billing_email ?? null,
    website: org.website ?? null,
    created_at: org.created_at,
    branches,
    vehicleCount: vehicleCount ?? 0,
    averageRating: reviewCount > 0 ? Math.round(averageRating! * 10) / 10 : null,
    reviewCount,
    reviews: reviewData ?? [],
  };
}

async function getVendorVehicles(organizationId: string): Promise<Vehicle[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(`
      id, slug, title, make, model, year, seats, fuel, transmission, category,
      price_per_day_aud, status,
      organizations!inner(name, slug),
      branches!inner(name, city, state, status),
      vehicle_images(storage_path, approved, sort_order)
    `)
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .order("price_per_day_aud", { ascending: true })
    .limit(12);

  if (!data) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return data.map((v) => {
    const org = v.organizations as unknown as { name: string; slug: string };
    const branch = v.branches as unknown as { name: string; city: string; state: string };
    const imgs = (v.vehicle_images as unknown as VehicleImageRecord[]) ?? [];
    return {
      id: v.id,
      slug: v.slug,
      title: v.title,
      make: v.make,
      model: v.model,
      year: v.year,
      seats: v.seats,
      fuel: v.fuel,
      transmission: v.transmission,
      category: v.category,
      pricePerDayAud: v.price_per_day_aud,
      city: branch.city,
      state: branch.state,
      imageUrl: resolveVehicleImage(supabaseUrl, imgs, v.category),
      vendorName: org.name,
      vendorSlug: org.slug,
      branchName: branch.name,
      verified: true,
    };
  });
}

// ── Star rating display ──────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({
  review,
}: {
  review: { id: string; customer_name: string; rating: number; body: string; created_at: string };
}) {
  return (
    <Card variant="default" className="p-0">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{review.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <StarDisplay rating={review.rating} />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function VendorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  if (!vendor) notFound();

  const fleet = await getVendorVehicles(vendor.id);

  const memberSince = new Date(vendor.created_at).getFullYear();

  const autoRentalSchema = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: vendor.name,
    url: `https://www.hirecarmarketplace.com.au/vendors/${vendor.slug}`,
    ...(vendor.phone && { telephone: vendor.phone }),
    ...(vendor.email && { email: vendor.email }),
    address: {
      "@type": "PostalAddress",
      addressLocality: vendor.city,
      addressRegion: vendor.state,
      addressCountry: "AU",
    },
  };

  const organizationSchema = buildOrganizationSchema({
    name: vendor.name,
    url: `/vendors/${vendor.slug}`,
    description: vendor.description || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas([autoRentalSchema, organizationSchema]) }}
      />
      <SiteHeader />

      {/* ── Vendor Header (Elevated Card) ── */}
      <div className="bg-muted border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{vendor.name}</span>
          </nav>

          <VendorProfileHeader
            name={vendor.name}
            verified={vendor.verified}
            city={vendor.city}
            state={vendor.state}
            vehicleCount={vendor.vehicleCount}
            averageRating={vendor.averageRating}
            reviewCount={vendor.reviewCount}
            description={vendor.description}
            memberSince={memberSince}
          />

          {/* Contact info (visible on larger screens) */}
          {(vendor.phone || vendor.email || vendor.website) && (
            <div className="hidden lg:flex items-center gap-6 mt-4 pt-4 border-t border-border">
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {vendor.phone}
                </a>
              )}
              {vendor.email && (
                <a
                  href={`mailto:${vendor.email}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  {vendor.email}
                </a>
              )}
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Visit website
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        {/* Vehicle Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Available Fleet
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({vendor.vehicleCount} vehicle{vendor.vehicleCount !== 1 ? "s" : ""})
              </span>
            </h2>
            {vendor.vehicleCount > 12 && (
              <Link
                href={`/search?vendor=${vendor.slug}`}
                className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {fleet.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8 text-muted-foreground" />}
              title="No vehicles available"
              description="This vendor doesn't have any vehicles listed at the moment. Check back later or browse other vendors."
              actionLabel="Browse all vehicles"
              actionHref="/search"
            />
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {fleet.map((vehicle, i) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i < 3} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Customer Reviews
            </h2>
            {vendor.reviewCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({vendor.reviewCount})
              </span>
            )}
          </div>

          {vendor.reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
              title="No reviews yet"
              description="This vendor hasn't received any reviews yet. Be the first to share your experience after renting."
              actionLabel="Browse vehicles"
              actionHref={`/search?vendor=${vendor.slug}`}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {vendor.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* Branches / Locations */}
        {vendor.branches.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
              Locations
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendor.branches.map((branch) => (
                <Card key={branch.id} variant="default" className="p-0">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {branch.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {branch.city}, {branch.state}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
