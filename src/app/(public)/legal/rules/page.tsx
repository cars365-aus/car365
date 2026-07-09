import { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShieldAlert, Car } from "lucide-react";

export const metadata: Metadata = {
  title: "Rules and Guidelines | Hire Car",
  description: "Community rules and platform guidelines for using Hire Car.",
};

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">Platform Rules & Guidelines</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            To maintain a safe, premium, and reliable marketplace for everyone in Australia, all users must adhere to the following guidelines.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">For Renters</h2>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <span className="font-bold text-amber-500">•</span>
                <span><strong>Valid License Required:</strong> You must hold a valid, unrestricted Australian driver&apos;s license (or an accepted international equivalent) to rent a vehicle.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-500">•</span>
                <span><strong>Respect the Vehicle:</strong> Treat the rented vehicle with care. You are responsible for returning it in the same condition as received, adhering to the vendor&apos;s specific fuel and cleaning policies.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-500">•</span>
                <span><strong>Report Incidents Immediately:</strong> In the event of an accident or breakdown, you must notify the Vendor and the appropriate emergency services immediately.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-500">•</span>
                <span><strong>Tolls and Fines:</strong> You are strictly responsible for all traffic infringements, parking fines, and toll charges incurred during your rental period.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Car className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">For Vendors</h2>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <span className="font-bold text-emerald-500">•</span>
                <span><strong>ABN Verification:</strong> You must operate under a valid Australian Business Number (ABN) and remain compliant with local business regulations.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-500">•</span>
                <span><strong>Vehicle Roadworthiness:</strong> All vehicles listed must be fully registered, comprehensively insured for rental purposes, and regularly serviced to ensure safety.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-500">•</span>
                <span><strong>Accurate Listings:</strong> You must provide truthful descriptions, clear photos, and transparent pricing without hidden fees. What the renter sees is what they should pay.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-500">•</span>
                <span><strong>Responsive Communication:</strong> You must respond to enquiries promptly and honor confirmed bookings. Frequent cancellations may result in account suspension.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
