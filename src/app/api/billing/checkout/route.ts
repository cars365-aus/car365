import { NextResponse, type NextRequest } from "next/server";
import { readFormDataBody, readJsonBody } from "@/lib/api/request";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { requireApiUser } from "@/lib/security/auth";
import { checkoutSchema } from "@/lib/validation/schemas";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const contentType = request.headers.get("content-type") ?? "";
  const rawPayloadResult = contentType.includes("application/json")
    ? await readJsonBody(request)
    : await readFormDataBody(request);

  if (rawPayloadResult.response) return rawPayloadResult.response;

  const rawPayload =
    rawPayloadResult.data instanceof FormData
      ? Object.fromEntries(rawPayloadResult.data.entries())
      : rawPayloadResult.data;

  const payload = checkoutSchema.safeParse(rawPayload);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  // SECURITY: Verify the authenticated user is a member of the target organization.
  // Without this check, any logged-in user could initiate a checkout for any org (IDOR).
  await ensureUserCanManageOrganization(user.id, payload.data.organizationId);

  // Retrieve existing customer ID if present to avoid duplicating customers in Stripe
  const supabase = createAdminClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("organization_id", payload.data.organizationId)
    .maybeSingle();

  if (subscription?.status === "active" || subscription?.status === "trialing") {
    return NextResponse.json({ 
      error: "You already have an active subscription. Please use the Billing Portal to switch plans." 
    }, { status: 409 });
  }

  const session = await createCheckoutSession({
    plan: payload.data.plan,
    interval: payload.data.interval,
    organizationId: payload.data.organizationId,
    userId: user.id,
    email: user.email,
    customerId: subscription?.stripe_customer_id ?? undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a Checkout URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
