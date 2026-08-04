import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { pageMetadata } from "@/lib/seo/metadata";

// Previously title-only: no description, so Google wrote its own snippet from
// whatever text it found on the page.
export const metadata = pageMetadata({
  path: "/how-it-works",
  title: "How Buying a Car From Cars365 Works",
  description:
    "From browsing to driving away — how buying a used car from Cars365 works: search, test drive, arrange finance, and drive away with a roadworthy certificate.",
});

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-card">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-black text-foreground mb-6">How It Works</h1>
        <p className="text-lg text-slate-600 mb-12">
          Buying a quality used car with Cars365 is simple, transparent, and pressure-free.
        </p>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">1</div>
            <h3 className="font-bold text-lg mb-2">Browse &amp; shortlist</h3>
            <p className="text-slate-600">Filter our inspected inventory to find cars that fit your needs and budget.</p>
          </div>
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">2</div>
            <h3 className="font-bold text-lg mb-2">Enquire</h3>
            <p className="text-slate-600">Call, WhatsApp, or send an enquiry — a specialist replies fast with honest answers.</p>
          </div>
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">3</div>
            <h3 className="font-bold text-lg mb-2">Inspect &amp; drive away</h3>
            <p className="text-slate-600">Book a viewing, arrange finance or a trade-in, and drive home with confidence.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
