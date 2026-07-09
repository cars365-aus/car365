import { getStripe } from "@/lib/billing/stripe";
import {
  approveOrganizationIfEligible,
  getSubscriptionPeriodFields,
  resolvePlanFromSubscription,
  SUBSCRIPTION_STATUS_MAP,
  syncInvoiceRecord,
  upsertSubscriptionRecord,
} from "@/lib/billing/webhook-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode } from "@/lib/types";
import type Stripe from "stripe";

function getSessionOrganizationId(session: Stripe.Checkout.Session): string | null {
  return session.client_reference_id ?? session.metadata?.organization_id ?? null;
}

function getSessionSubscriptionId(session: Stripe.Checkout.Session): string | null {
  const subscription = session.subscription;
  if (typeof subscription === "string") return subscription;
  if (subscription && typeof subscription === "object") return subscription.id;
  return null;
}

function getSessionCustomerId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.customer === "string") return session.customer;
  if (session.customer && typeof session.customer === "object") return session.customer.id;
  return null;
}

async function syncLatestInvoice(subscriptionId: string) {
  const stripe = getStripe();
  const supabase = createAdminClient();
  const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });

  if (invoices.data[0]) {
    await syncInvoiceRecord(supabase, invoices.data[0]);
  }
}

async function applyStripeSubscription(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id;
  const planInfo = resolvePlanFromSubscription(subscription);

  if (!organizationId || !planInfo) {
    throw new Error("Stripe subscription is missing organization or plan metadata");
  }

  const mappedStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] || "incomplete";
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const supabase = createAdminClient();
  await upsertSubscriptionRecord(supabase, {
    organizationId,
    plan: planInfo.plan,
    interval: planInfo.interval,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: mappedStatus,
    periodFields: getSubscriptionPeriodFields(subscription),
  });

  if (mappedStatus === "active" || mappedStatus === "trialing") {
    await approveOrganizationIfEligible(supabase, organizationId);
  }

  await syncLatestInvoice(subscription.id);

  return { organizationId, plan: planInfo.plan, status: mappedStatus };
}

async function applyCheckoutSession(session: Stripe.Checkout.Session) {
  const organizationId = getSessionOrganizationId(session);
  const plan = session.metadata?.plan as PlanCode | undefined;
  const interval = (session.metadata?.interval || "monthly") as "monthly" | "annual";
  const subscriptionId = getSessionSubscriptionId(session);
  const customerId = getSessionCustomerId(session);

  if (!organizationId || !plan || !subscriptionId) {
    throw new Error("Checkout session is missing organization, plan, or subscription");
  }

  if (session.status !== "complete") {
    throw new Error("Checkout session is not complete yet");
  }

  let periodFields: Partial<ReturnType<typeof getSubscriptionPeriodFields>> = {};
  if (session.subscription && typeof session.subscription === "object") {
    periodFields = getSubscriptionPeriodFields(session.subscription);
  } else {
    const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
    periodFields = getSubscriptionPeriodFields(stripeSubscription);
  }

  const supabase = createAdminClient();
  await upsertSubscriptionRecord(supabase, {
    organizationId,
    plan,
    interval,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: "active",
    periodFields,
  });

  await approveOrganizationIfEligible(supabase, organizationId);
  await syncLatestInvoice(subscriptionId);

  return { organizationId, plan, status: "active" as const };
}

export async function syncCheckoutSessionForOrganization(
  organizationId: string,
  sessionId?: string,
) {
  const stripe = getStripe();

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionOrgId = getSessionOrganizationId(session);
    if (sessionOrgId !== organizationId) {
      throw new Error("Checkout session does not belong to this organization");
    }

    return applyCheckoutSession(session);
  }

  const searchResult = await stripe.subscriptions.search({
    query: `metadata['organization_id']:'${organizationId}'`,
    limit: 1,
  });

  const subscription = searchResult.data[0];
  if (subscription) {
    return applyStripeSubscription(subscription);
  }

  const sessions = await stripe.checkout.sessions.list({ limit: 25 });
  const completedSession = sessions.data.find(
    (session) =>
      session.status === "complete" && getSessionOrganizationId(session) === organizationId,
  );

  if (!completedSession) {
    throw new Error("No completed checkout found for this organization");
  }

  const session = await stripe.checkout.sessions.retrieve(completedSession.id, {
    expand: ["subscription"],
  });

  return applyCheckoutSession(session);
}
