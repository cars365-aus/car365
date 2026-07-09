-- Performance indices and DDL cleanup missed in prior migrations.

-- 1. leads_archive: Extract from inside the plpgsql function to a proper DDL migration.
--    The archive function used CREATE TABLE IF NOT EXISTS inside the function body,
--    which works but is unusual and harder to observe in schema diffs.
CREATE TABLE IF NOT EXISTS public.leads_archive (
  LIKE public.leads INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_reason text DEFAULT 'expired'
);

ALTER TABLE public.leads_archive ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'leads_archive' 
        AND policyname = 'admins read leads_archive'
    ) THEN
        CREATE POLICY "admins read leads_archive" ON public.leads_archive
          FOR SELECT USING (app_private.is_platform_admin());
    END IF;
END $$;

-- 2. Missing index on reviews (queried frequently by org + status in admin dashboard)
CREATE INDEX IF NOT EXISTS idx_reviews_org_status
ON public.reviews(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id
ON public.reviews(vehicle_id)
WHERE vehicle_id IS NOT NULL;

-- 3. Missing index on contact_clicks (vendor dashboard queries last 30 days by vendor)
CREATE INDEX IF NOT EXISTS idx_contact_clicks_vendor_created
ON public.contact_clicks(vendor_id, created_at DESC);

-- 4. Missing indices on vehicle_views (used in deduplication check per vehicle+IP+hour)
CREATE INDEX IF NOT EXISTS idx_vehicle_views_vehicle_created
ON public.vehicle_views(vehicle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_views_ip_hash
ON public.vehicle_views(ip_hash)
WHERE ip_hash IS NOT NULL;

-- 5. Missing index on stripe_webhook_events for the received_at column
--    (admin dashboard queries last 24h)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received_at
ON public.stripe_webhook_events(received_at DESC);

-- 6. Missing index on lead_events for quick lookup by lead_id
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id
ON public.lead_events(lead_id, created_at ASC);
