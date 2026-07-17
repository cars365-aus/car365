import Link from "next/link";
import type { Metadata } from "next";
import { Star, Quote } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { getApprovedTestimonials } from "@/lib/data/content";
import { getCompanyProfile } from "@/lib/data/settings";
import { reviewsAggregateSchema, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Customer Reviews & Testimonials",
  description: "Real stories from customers who bought their car with us — honest inspections, fair pricing, and a team that answers fast.",
};

export const revalidate = 3600;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < rating ? "size-4 fill-primary text-primary" : "size-4 text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default async function TestimonialsPage() {
  const [testimonials, company] = await Promise.all([
    getApprovedTestimonials(60),
    getCompanyProfile(),
  ]);

  const rating = company.google_rating as number | undefined;
  const reviewCount = company.google_review_count as number | undefined;
  const aggregate = reviewsAggregateSchema(testimonials);

  return (
    <>
      <JsonLd schema={[breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Testimonials", path: "/testimonials" }]), ...(aggregate ? [aggregate] : [])]} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span className="text-foreground">Testimonials</span>
        </nav>
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">What our customers say</h1>
          <p className="mt-3 text-body">
            {rating ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star className="size-4 fill-primary text-primary" />{rating}</span>
                {reviewCount ? <span className="text-muted-foreground">from {reviewCount.toLocaleString()} reviews</span> : null}
              </span>
            ) : "Honest feedback from real buyers."}
          </p>
        </div>

        {testimonials.length === 0 ? (
          <p className="mt-10 text-muted-foreground">No testimonials published yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <Quote className="size-6 text-primary/60" />
                <blockquote className="mt-3 flex-1 text-body">{t.quote}</blockquote>
                <figcaption className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-semibold text-foreground">{t.customerName}</span>
                  <Stars rating={t.rating} />
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="font-heading text-xl font-bold text-foreground">Ready to find your next car?</h2>
          <p className="mx-auto mt-2 max-w-md text-body">Browse our inspected inventory or get in touch — we reply fast.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/used-cars" className="inline-flex h-11 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary-hover">Browse cars</Link>
            <Link href="/contact" className="inline-flex h-11 items-center rounded-xl border border-border px-6 font-semibold text-foreground hover:bg-muted">Contact us</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
