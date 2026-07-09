import { NextResponse, type NextRequest } from "next/server";
import { readFormDataBody } from "@/lib/api/request";
import { getStripe } from "@/lib/billing/stripe";
import { getAppUrl } from "@/lib/config";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { requireApiUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { data: formData, response: formError } = await readFormDataBody(request);
  if (formError) return formError;

  const organizationId = String(formData.get("organizationId") ?? "");
  const customerIdFromForm = String(formData.get("stripeCustomerId") ?? "");

  if (!organizationId) {
    return NextResponse.json({ error: "Missing organization" }, { status: 400 });
  }

  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
  } catch {
    return NextResponse.json(
      { error: "You do not have permission to manage billing for this organization" },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const customerId = subscription?.stripe_customer_id ?? customerIdFromForm;

  if (!customerId?.startsWith("cus_")) {
    return NextResponse.json(
      { error: "No Stripe customer found for this organization. Please subscribe first." },
      { status: 400 },
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/vendor/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open billing portal";
    console.error("[billing-portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
