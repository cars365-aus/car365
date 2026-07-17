import Link from "next/link";
import type { Metadata } from "next";
import { HelpCircle, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { getPublishedFaqs } from "@/lib/data/content";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { FaqAccordion } from "./faq-client";
import { FadeInItem, FadeInStagger } from "@/components/animations/hero-animations";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Cars365",
  description: "Answers to common questions about buying, selling, financing, warranty, and inspections at Cars365.",
};

export const revalidate = 3600;

export default async function FaqsPage() {
  const faqs = await getPublishedFaqs();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <JsonLd schema={[faqPageSchema(faqs), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "FAQs", path: "/faqs" }])]} />
      <SiteHeader />
      
      <main>
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#0b1320] py-20 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <FadeInStagger>
              <FadeInItem>
                <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-black shadow-[0_0_30px_rgba(255,204,0,0.3)]">
                  <HelpCircle className="size-8" />
                </div>
              </FadeInItem>
              <FadeInItem>
                <h1 className="font-heading text-4xl font-black tracking-tight text-white sm:text-6xl mb-6">
                  Got Questions? <br className="hidden sm:block" />
                  <span className="text-primary">We've got answers.</span>
                </h1>
              </FadeInItem>
              <FadeInItem>
                <p className="mx-auto max-w-2xl text-lg text-slate-300">
                  Everything you need to know about buying, selling, and financing with Cars365. 
                  Straightforward answers for a straightforward process.
                </p>
              </FadeInItem>
            </FadeInStagger>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          {faqs.length === 0 ? (
            <p className="text-center text-lg text-slate-400">No FAQs published yet. Check back soon.</p>
          ) : (
            <FaqAccordion faqs={faqs} />
          )}

          {/* Contact Call to action */}
          <div className="mt-32 max-w-3xl mx-auto rounded-3xl border border-border bg-slate-900 p-10 sm:p-14 text-center relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <h3 className="relative z-10 font-heading text-3xl font-bold text-white mb-4">Still need help?</h3>
            <p className="relative z-10 text-lg text-slate-300 mb-8 max-w-lg mx-auto">
              If you couldn't find what you're looking for, our team is ready to assist you directly.
            </p>
            <Link href="/contact" className="relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,204,0,0.2)]">
              Get in touch <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}
