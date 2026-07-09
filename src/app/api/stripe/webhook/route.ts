import { NextResponse, type NextRequest } from "next/server";
import {
  claimStripeWebhookEvent,
  describeClaimError,
} from "@/lib/billing/claim-webhook-event";
import { getStripe } from "@/lib/billing/stripe";
import {
  approveOrganizationIfEligible,
  getInvoiceSubscriptionId,
  getSubscriptionPeriodFields,
  resolvePlanFromSubscription,
  SUBSCRIPTION_STATUS_MAP,
  syncInvoiceRecord,
  upsertSubscriptionRecord,
} from "@/lib/billing/webhook-helpers";
import { requireEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode } from "@/lib/types";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    return await handleWebhook(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.slice(0, 500) : undefined;
    console.error("[stripe-webhook] Unhandled error:", message, stack);
    return NextResponse.json(
      { error: "Internal webhook error", detail: message },
      { status: 500 },
    );
  }
}

async function handleWebhook(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Stripe signature",
        hint: "Ensure STRIPE_WEBHOOK_SECRET matches this endpoint's signing secret and disable any old Stripe webhook destinations.",
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const claim = await claimStripeWebhookEvent(supabase, event);

  if (!claim.claimed) {
    if (claim.duplicate || claim.inProgress) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const detail = describeClaimError(claim.code, claim.error);
    console.error(`Failed to claim webhook event ${event.id}:`, detail, claim.code);
    return NextResponse.json(
      {
        error: "Webhook processing could not be started",
        eventId: event.id,
        detail,
        code: claim.code,
      },
      { status: 500 },
    );
  }

  try {
    await processStripeEvent(event, supabase);

    const { error: subscriptionEventError } = await supabase.from("subscription_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: JSON.parse(JSON.stringify(event)),
    });

    if (subscriptionEventError) {
      throw new Error(`Failed to record subscription event: ${subscriptionEventError.message}`);
    }

    const { error: processedError } = await supabase
      .from("stripe_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", event.id);

    if (processedError) {
      throw new Error(`Failed to mark webhook processed: ${processedError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("stripe_webhook_events")
      .update({
        processing_status: "failed",
        last_error: errorMessage,
      })
      .eq("id", event.id);

    await supabase.from("security_events").insert({
      event_type: "webhook_processing_failed",
      metadata: {
        stripe_event_id: event.id,
        event_type: event.type,
        error: errorMessage,
      },
    });

    console.error(`Webhook processing failed for ${event.id}:`, errorMessage);

    return NextResponse.json(
      { error: "Webhook processing failed", eventId: event.id, detail: errorMessage },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function processStripeEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  await supabase.from("audit_logs").insert({
    action: "webhook_processing_started",
    resource_type: "stripe_event",
    metadata: {
      stripe_event_id: event.id,
      event_type: event.type,
      created_at: new Date().toISOString(),
    },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      const plan = session.metadata?.plan as PlanCode | undefined;
      const interval = (session.metadata?.interval || "monthly") as "monthly" | "annual";
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (!organizationId || !plan || !subscriptionId) {
        const missing = [
          !organizationId && "organization_id",
          !plan && "plan",
          !subscriptionId && "subscription",
        ].filter(Boolean);
        throw new Error(
          `Missing required data in checkout.session.completed: ${missing.join(", ")}`,
        );
      }

      await upsertSubscriptionRecord(supabase, {
        organizationId,
        plan,
        interval,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: "active",
        periodFields: {
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      await approveOrganizationIfEligible(supabase, organizationId);

      await supabase.from("audit_logs").insert({
        action: "subscription_activated",
        resource_type: "subscription",
        resource_id: organizationId,
        metadata: { plan, stripe_subscription_id: subscriptionId },
      });
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("organization_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (subscription) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
      }

      if (invoice.status === "paid" || event.type !== "invoice.finalized") {
        try {
          await syncInvoiceRecord(supabase, invoice);
        } catch (invoiceError) {
          console.error(
            `[stripe-webhook] Invoice sync failed for ${invoice.id}:`,
            invoiceError instanceof Error ? invoiceError.message : invoiceError,
          );
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const mappedStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] || "incomplete";
      const periodFields = getSubscriptionPeriodFields(subscription);
      const planInfo = resolvePlanFromSubscription(subscription);
      const organizationId = subscription.metadata?.organization_id;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null;

      if (event.type === "customer.subscription.created" && organizationId && planInfo) {
        await upsertSubscriptionRecord(supabase, {
          organizationId,
          plan: planInfo.plan,
          interval: planInfo.interval,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: mappedStatus,
          periodFields,
        });

        if (mappedStatus === "active" || mappedStatus === "trialing") {
          await approveOrganizationIfEligible(supabase, organizationId);
        }
      } else {
        const { data: updatedSub } = await supabase
          .from("subscriptions")
          .update({
            status: mappedStatus,
            ...(planInfo ? { plan_code: planInfo.plan, billing_interval: planInfo.interval } : {}),
            ...periodFields,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId)
          .select("organization_id")
          .maybeSingle();

        if (updatedSub) {
          if (mappedStatus === "canceled" || mappedStatus === "unpaid") {
            await supabase
              .from("organizations")
              .update({ status: "suspended", suspended_at: new Date().toISOString() })
              .eq("id", updatedSub.organization_id);
          } else if (mappedStatus === "active" || mappedStatus === "trialing") {
            const { data: org } = await supabase
              .from("organizations")
              .select("status")
              .eq("id", updatedSub.organization_id)
              .single();
            const { count: fraudCount } = await supabase
              .from("fraud_flags")
              .select("id", { count: "exact", head: true })
              .eq("resource_id", updatedSub.organization_id)
              .eq("status", "open");

            if (org?.status === "suspended" && fraudCount === 0) {
              await supabase
                .from("organizations")
                .update({ status: "approved", suspended_at: null })
                .eq("id", updatedSub.organization_id);
            }
          }
        } else if (organizationId && planInfo) {
          await upsertSubscriptionRecord(supabase, {
            organizationId,
            plan: planInfo.plan,
            interval: planInfo.interval,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: mappedStatus,
            periodFields,
          });

          if (mappedStatus === "active" || mappedStatus === "trialing") {
            await approveOrganizationIfEligible(supabase, organizationId);
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const { data: deletedSub } = await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId)
        .select("organization_id")
        .maybeSingle();

      if (deletedSub) {
        await supabase
          .from("organizations")
          .update({ status: "suspended", suspended_at: new Date().toISOString() })
          .eq("id", deletedSub.organization_id);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;

      if (organizationId) {
        await supabase.from("audit_logs").insert({
          action: "checkout_abandoned",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            stripe_session_id: session.id,
            plan: session.metadata?.plan,
          },
        });
      }
      break;
    }

    default:
      console.info(`Unhandled Stripe event type: ${event.type}`);

      await supabase.from("audit_logs").insert({
        action: "webhook_unhandled_event_type",
        resource_type: "stripe_event",
        metadata: {
          stripe_event_id: event.id,
          event_type: event.type,
        },
      });
  }
}
