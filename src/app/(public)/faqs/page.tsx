import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { getPublishedFaqs } from "@/lib/data/content";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about buying, selling, financing, warranty, and inspections.",
};

export const revalidate = 3600;

export default async function FaqsPage() {
  const faqs = await getPublishedFaqs();

  // Group by category, preserving order.
  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <JsonLd schema={[faqPageSchema(faqs), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "FAQs", path: "/faqs" }])]} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden>/</span> <span className="text-foreground">FAQs</span>
        </nav>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-body">Can&apos;t find what you&apos;re after? <Link href="/contact" className="text-primary hover:underline">Get in touch</Link>.</p>

        {faqs.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No FAQs published yet.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {Object.entries(groups).map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">{category}</h2>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {items.map((f) => (
                    <details key={f.id} className="group p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                        {f.question}
                        <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 text-sm text-body">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
