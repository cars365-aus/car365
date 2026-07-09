# Payment QA Checklist

This checklist provides step-by-step instructions for testing the Stripe billing flows. Use Stripe Test Mode keys before moving to production.

## 1. Initial Setup & Environment
- [ ] Configure Stripe Test Mode keys in `.env.local`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- [ ] Create 6 products in Stripe Test Mode (Starter, Growth, Pro for both Monthly and Quarterly).
- [ ] Copy the generated Price IDs into `.env.local`.
- [ ] Ensure Supabase migrations are fully applied (run `npx supabase db push` or equivalent).

## 2. New Subscription (Checkout Flow)
- [ ] Create a new test organization via the onboarding flow.
- [ ] Navigate to the Billing page.
- [ ] Select **Monthly Starter** plan and initiate checkout.
- [ ] Complete the checkout with a test card (e.g., `4242 4242 4242 4242`).
- [ ] Verify you are redirected back to the app on success.
- [ ] Wait ~3-5 seconds and refresh. **Verify the UI shows "Active", the Starter plan, and the next renewal date.**

## 3. Webhook & Invoice Sync Verification
- [ ] Navigate to the bottom of the Billing page.
- [ ] Verify an invoice appears under "Billing History".
- [ ] Click the invoice download icon. **Verify it opens the Stripe-hosted PDF.**
- [ ] Check Supabase `subscriptions` table. Verify `stripe_customer_id` and `stripe_subscription_id` are populated.

## 4. Upgrades (Customer Portal Flow)
- [ ] From the Billing page, click **"Manage Billing Portal"** or click **"Switch to Growth"**.
- [ ] In the Stripe Portal, select the **Growth Plan**.
- [ ] Confirm the prorated charge in Stripe.
- [ ] Return to the app. Wait ~5 seconds and refresh.
- [ ] **Verify the UI now displays "Growth" as the active plan.**
- [ ] **Verify the database `subscriptions` table `plan_code` updated to `growth`.**

## 5. Quarterly Billing & Downgrades
- [ ] From the Billing page, click **"Quarterly"** toggle.
- [ ] Click **"Switch to Starter"** (Downgrading from Monthly Growth to Quarterly Starter).
- [ ] Stripe Portal should indicate this change will take effect at the *end of the billing cycle*. Confirm the change.
- [ ] Return to the app. 
- [ ] **Verify the UI still shows "Growth" (since you retain access until period end) but the next renewal indicates the plan change.**

## 6. Cancellations
- [ ] Go to the Stripe Portal.
- [ ] Select **Cancel Subscription**.
- [ ] Return to the app. Wait ~5 seconds and refresh.
- [ ] **Verify the UI displays the yellow "Subscription Canceling" warning banner.**
- [ ] Verify you still have access to the Growth plan features until the `periodEnd` date.
- [ ] Verify Supabase `subscriptions` table `cancel_at_period_end` is `true`.

## 7. Failed Payments & Dunning
- [ ] In the Stripe Dashboard, force an invoice to fail for the customer.
- [ ] Trigger the webhook.
- [ ] **Verify the app UI shows the status as "Past Due" or "Unpaid" in red.**
- [ ] **Verify the database `subscriptions` status is `past_due`.**

## 8. Customer Reuse
- [ ] After canceling, wait for the subscription to fully expire or delete it via Stripe.
- [ ] Initiate a new checkout from the app.
- [ ] Check the Stripe Dashboard. **Verify a new subscription was added to the EXISTING customer record, rather than creating a duplicate customer.**
