-- Ensure the service role can manage Stripe webhook idempotency tables.
-- Some Supabase API key configurations require explicit service_role policies
-- even though service_role normally bypasses RLS.

GRANT ALL ON public.stripe_webhook_events TO service_role;
GRANT ALL ON public.subscription_events TO service_role;

DROP POLICY IF EXISTS "service role manages stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "service role manages stripe webhook events"
ON public.stripe_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages subscription events" ON public.subscription_events;
CREATE POLICY "service role manages subscription events"
ON public.subscription_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
