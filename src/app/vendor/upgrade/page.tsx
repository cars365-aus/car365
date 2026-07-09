import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  MessageSquare,
  Store,
  X,
} from "lucide-react";
import { getVendorContext } from "@/lib/data/vendor";
import {
  buildVendorOnboardingHref,
  isSafeRedirectPath,
} from "@/lib/routing";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Upgrade to Vendor | Hire Car",
};

const vendorBenefits = [
  "List your vehicles and reach renters across Australia",
  "Receive direct enquiries via chat, phone, and WhatsApp",
  "Manage leads, branches, and fleet from one dashboard",
  "Choose a plan that fits your business size",
];

export default async function VendorUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; from?: string }>;
}) {
  const user = await requireUser();
  const context = await getVendorContext(user.id);
  const params = await searchParams;
  const plan = params.plan ?? null;
  const from = params.from && isSafeRedirectPath(params.from) ? params.from : null;

  if (context.organizations.length > 0) {
    redirect(from ?? "/vendor/dashboard");
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const onboardingHref = buildVendorOnboardingHref({ plan, from });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
            <Store className="h-8 w-8" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Vendor account
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Upgrade your account?
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Hi {firstName}, you&apos;re currently using Hire Car as a{" "}
            <span className="font-semibold text-slate-900">customer</span>. Would
            you like to upgrade to a vendor account and start listing your fleet?
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          {vendorBenefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {from && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You tried to open{" "}
            <span className="font-semibold">{from}</span>. After onboarding, you
            can pick up right where you left off.
          </p>
        )}

        {plan && (
          <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            You selected the <span className="font-semibold">{plan}</span> plan.
            We&apos;ll guide you through setup and billing next.
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={onboardingHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-amber-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Car className="h-4 w-4" />
            Yes, become a vendor
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/customer/dashboard"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            No, stay as customer
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your customer enquiries and account stay intact. You can use both
          customer and vendor features once upgraded.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <MessageSquare className="h-4 w-4" />
          Questions?{" "}
          <Link href="/contact" className="font-semibold text-orange-600 hover:text-orange-700">
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
}
