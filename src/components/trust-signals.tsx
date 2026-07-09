import { ShieldCheck, DollarSign, Map, Car } from "lucide-react";

const signals = [
  { icon: ShieldCheck, label: "Verified Rental Businesses" },
  { icon: DollarSign, label: "No Marketplace Fees" },
  { icon: Map, label: "Australia Wide" },
  { icon: Car, label: "Cars, Vans, Utes & Luxury Vehicles" },
];

export function TrustSignals() {
  return (
    <section className="border-y border-slate-200 bg-white py-6 mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {signals.map((signal) => {
            const Icon = signal.icon;
            return (
              <div key={signal.label} className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-[#ea580c]" />
                <span className="text-sm font-bold text-slate-700">{signal.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
