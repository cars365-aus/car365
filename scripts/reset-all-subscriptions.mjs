import { config } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: subscriptions, error } = await supabase
  .from("subscriptions")
  .select("id, organization_id, plan_code, status, stripe_subscription_id, stripe_customer_id");

if (error) {
  console.error("Failed to load subscriptions:", error.message);
  process.exit(1);
}

if (!subscriptions?.length) {
  console.log("No subscriptions found.");
  process.exit(0);
}

for (const sub of subscriptions) {
  console.log(
    `Resetting ${sub.plan_code} org ${sub.organization_id} (${sub.stripe_subscription_id ?? "no stripe sub"})`,
  );

  if (sub.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      console.log("  canceled Stripe subscription");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log("  Stripe cancel skipped:", message);
    }
  }

  const { error: invoiceError } = await supabase
    .from("invoices")
    .delete()
    .eq("organization_id", sub.organization_id);

  if (invoiceError) {
    console.error("  failed to delete invoices:", invoiceError.message);
    process.exit(1);
  }

  const { error: deleteError } = await supabase.from("subscriptions").delete().eq("id", sub.id);

  if (deleteError) {
    console.error("  failed to delete subscription:", deleteError.message);
    process.exit(1);
  }

  console.log("  deleted DB subscription + invoices");
}

console.log(`Done. Reset ${subscriptions.length} subscription(s).`);
