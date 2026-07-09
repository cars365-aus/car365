import { OnboardingWizard } from "./_components/onboarding-wizard";
import { requireUser } from "@/lib/security/auth";
import { getVendorContext } from "@/lib/data/vendor";
import { redirect } from "next/navigation";

export default async function VendorOnboardingPage(props: {
  searchParams: Promise<{ plan?: string; from?: string }>;
}) {
  const user = await requireUser();
  const context = await getVendorContext(user.id);
  const searchParams = await props.searchParams;
  const plan = searchParams.plan;

  if (context.organizations.length > 0) {
    redirect("/vendor/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl py-10 animate-slide-up">
      <section className="glass rounded-3xl border border-slate-200/50 p-8 sm:p-12 shadow-xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vendor onboarding</h1>
          <p className="mt-3 text-lg text-slate-600">
            Set up your business profile so you can list vehicles and start receiving leads.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Your customer account stays active — you can still manage enquiries while you onboard.
          </p>
        </div>

        <OnboardingWizard plan={plan} />
      </section>
    </div>
  );
}
