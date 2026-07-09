import { config } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const orgId = process.argv[2] ?? "75b686c9-a681-4d05-8e18-41747d97d49a";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const search = await stripe.subscriptions.search({
  query: `metadata['organization_id']:'${orgId}'`,
  limit: 1,
});

const sub = search.data[0];
if (!sub) {
  console.error("No Stripe subscription found for org", orgId);
  process.exit(1);
}

const plan = sub.metadata.plan ?? "starter";
const interval = sub.metadata.interval ?? "monthly";
const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
const periodStart = sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start;

const upsert = await supabase.from("subscriptions").upsert(
  {
    organization_id: orgId,
    plan_code: plan,
    billing_interval: interval,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: "active",
    ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
    ...(periodStart ? { current_period_start: new Date(periodStart * 1000).toISOString() } : {}),
    updated_at: new Date().toISOString(),
  },
  { onConflict: "organization_id" },
);

if (upsert.error) {
  console.error("Upsert failed:", upsert.error.message);
  process.exit(1);
}

const org = await supabase
  .from("organizations")
  .update({ status: "approved", suspended_at: null })
  .eq("id", orgId);

if (org.error) {
  console.error("Org update failed:", org.error.message);
  process.exit(1);
}

console.log("Synced subscription:", { orgId, plan, subscriptionId: sub.id, status: sub.status });
