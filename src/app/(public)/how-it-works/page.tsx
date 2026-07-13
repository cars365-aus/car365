import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "How It Works | Hire Car" };

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-card">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-black text-foreground mb-6">How It Works</h1>
        <p className="text-lg text-slate-600 mb-12">
          Discover how easy it is to rent a car directly from verified local operators.
        </p>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">1</div>
            <h3 className="font-bold text-lg mb-2">Search</h3>
            <p className="text-slate-600">Find the perfect vehicle from our directory of independent operators.</p>
          </div>
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">2</div>
            <h3 className="font-bold text-lg mb-2">Book</h3>
            <p className="text-slate-600">Send an inquiry or instantly book your chosen vehicle.</p>
          </div>
          <div className="p-6 bg-muted rounded-2xl">
            <div className="text-2xl font-black text-amber-500 mb-4">3</div>
            <h3 className="font-bold text-lg mb-2">Drive</h3>
            <p className="text-slate-600">Pick up your car directly from the operator and enjoy your trip.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
