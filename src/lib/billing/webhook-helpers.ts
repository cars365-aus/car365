import { getPlanFromStripePrice } from "@/lib/billing/stripe";
import type { PlanCode } from "@/lib/types";
import type { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

type AdminClient = ReturnType<typeof createAdminClient>;

export const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  active: "active",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "canceled",
  past_due: "past_due",
  paused: "canceled",
  trialing: "trialing",
  unpaid: "unpaid",
};

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = (invoice as unknown as Record<string, unknown>).subscription;
  if (typeof subscription === "string") return subscription;
  if (subscription && typeof subscription === "object" && "id" in subscription) {
    return (subscription as { id: string }).id;
  }

  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | { id?: string } } }
    | null
    | undefined;
  const nested = parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && nested.id) return nested.id;

  return null;
}

export function getInvoiceCustomerId(invoice: Stripe.Invoice): string | null {
  if (typeof invoice.customer === "string") return invoice.customer;
  if (invoice.customer && typeof invoice.customer === "object") {
    return invoice.customer.id;
  }
  return null;
}

export function getOrganizationIdFromInvoiceMetadata(invoice: Stripe.Invoice): string | null {
  const lineMetadata = invoice.lines?.data?.[0]?.metadata;
  if (lineMetadata?.organization_id) return lineMetadata.organization_id;

  const subscriptionMetadata = (
    invoice as unknown as {
      subscription_details?: { metadata?: { organization_id?: string } };
    }
  ).subscription_details?.metadata;
  if (subscriptionMetadata?.organization_id) return subscriptionMetadata.organization_id;

  const parentMetadata = (
    invoice.parent as { subscription_details?: { metadata?: { organization_id?: string } } } | null
  )?.subscription_details?.metadata;
  if (parentMetadata?.organization_id) return parentMetadata.organization_id;

  return null;
}

export function resolvePlanFromSubscription(subscription: Stripe.Subscription): {
  plan: PlanCode;
  interval: "monthly" | "annual";
} | null {
  const planFromMeta = subscription.metadata?.plan as PlanCode | undefined;
  const intervalFromMeta = subscription.metadata?.interval as "monthly" | "annual" | undefined;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planInfo = priceId ? getPlanFromStripePrice(priceId) : null;

  const plan = planFromMeta || planInfo?.plan;
  const interval = intervalFromMeta || planInfo?.interval || "monthly";

  if (!plan) return null;
  return { plan, interval };
}

function toPeriodIso(timestamp: number | undefined | null) {
  if (!timestamp || !Number.isFinite(timestamp)) return undefined;
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function getSubscriptionPeriodFields(subscription: Stripe.Subscription) {
  const subRecord = subscription as unknown as Record<string, unknown>;
  const item = subscription.items?.data?.[0] as
    | { current_period_end?: number; current_period_start?: number }
    | undefined;
  const currentPeriodEnd =
    (subRecord.current_period_end as number | undefined) ?? item?.current_period_end;
  const currentPeriodStart =
    (subRecord.current_period_start as number | undefined) ?? item?.current_period_start;
  const cancelAtPeriodEnd = subRecord.cancel_at_period_end as boolean | undefined;
  const canceledAt = subRecord.canceled_at as number | undefined;

  return {
    current_period_end: toPeriodIso(currentPeriodEnd),
    current_period_start: toPeriodIso(currentPeriodStart),
    cancel_at_period_end: cancelAtPeriodEnd,
    canceled_at: toPeriodIso(canceledAt),
  };
}

export async function upsertSubscriptionRecord(
  supabase: AdminClient,
  input: {
    organizationId: string;
    plan: PlanCode;
    interval: "monthly" | "annual";
    stripeCustomerId: string | null;
    stripeSubscriptionId: string;
    status: string;
    periodFields?: Partial<ReturnType<typeof getSubscriptionPeriodFields>>;
  },
) {
  const { error } = await supabase.from("subscriptions").upsert(
    {
      organization_id: input.organizationId,
      plan_code: input.plan,
      billing_interval: input.interval,
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.stripeSubscriptionId,
      status: input.status,
      ...input.periodFields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

export async function approveOrganizationIfEligible(
  supabase: AdminClient,
  organizationId: string,
) {
  const { count: fraudCount } = await supabase
    .from("fraud_flags")
    .select("id", { count: "exact", head: true })
    .eq("resource_id", organizationId)
    .eq("status", "open");

  if (fraudCount === 0) {
    await supabase
      .from("organizations")
      .update({ status: "approved", suspended_at: null, updated_at: new Date().toISOString() })
      .eq("id", organizationId);
  }
}

export async function syncInvoiceRecord(
  supabase: AdminClient,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getInvoiceCustomerId(invoice);
  if (!subscriptionId || !customerId) return;

  let organizationId: string | null = null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  organizationId = subscription?.organization_id ?? getOrganizationIdFromInvoiceMetadata(invoice);

  if (!organizationId) return;

  const { error } = await supabase.from("invoices").upsert(
    {
      organization_id: organizationId,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status || "paid",
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
    },
    { onConflict: "stripe_invoice_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert invoice: ${error.message}`);
  }
}
