-- CORRECTED: stripe_webhook_events already has processing_status, received_at,
-- and last_error defined in the initial migration (20260527100000).
-- The only genuinely new thing this migration should add is the index.

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processing_status
ON public.stripe_webhook_events(processing_status);
