# Runbook: Stripe Webhook Failure

1. Check Vercel function logs for `/api/stripe/webhook`.
2. Confirm `STRIPE_WEBHOOK_SECRET` matches the active Stripe endpoint.
3. Verify the event exists in `stripe_webhook_events`.
4. If not processed, replay the event from the Stripe Dashboard.
5. Confirm `subscription_events` and the affected organization subscription state.
6. Record the incident in the admin audit notes.
