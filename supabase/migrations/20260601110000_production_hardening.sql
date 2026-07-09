-- Alter enum to add draft and archived statuses
ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'archived';

-- Create scaling indices for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id ON public.vehicles(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_status ON public.vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_branch_status ON public.vehicles(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at_desc ON public.vehicles(created_at desc);

-- Create scaling indices for leads
CREATE INDEX IF NOT EXISTS idx_leads_vendor_id ON public.leads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_created ON public.leads(vendor_id, created_at desc);

-- Create scaling indices for messages
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON public.messages(lead_id, created_at asc);

-- Create scaling indices for images and branches
CREATE INDEX IF NOT EXISTS idx_vehicle_images_sort ON public.vehicle_images(vehicle_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_branches_org_status ON public.branches(organization_id, status);

-- Add Typesense retry tracking columns
ALTER TABLE public.search_index_jobs
ADD COLUMN attempts integer not null default 0,
ADD COLUMN last_error text,
ADD COLUMN next_run_at timestamptz;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- Update RLS to ensure draft and archived vehicles are not visible publicly
-- We must update the "public read approved vehicles" policy
DROP POLICY IF EXISTS "public read approved vehicles" ON public.vehicles;

CREATE POLICY "public read approved vehicles" ON public.vehicles
FOR SELECT USING (
  (
    status = 'approved'
    AND exists (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.status = 'approved')
    AND exists (SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.status = 'approved')
    AND exists (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.organization_id = vehicles.organization_id 
      AND s.status IN ('active', 'trialing')
    )
  )
  OR app_private.is_org_member(organization_id)
  OR app_private.is_platform_admin()
);

-- Harden exposed RPC functions. View tracking is only called from trusted server
-- routes with the service-role client; it does not need SECURITY DEFINER or
-- public/anon execution rights.
CREATE OR REPLACE FUNCTION public.increment_vehicle_view(
  p_vehicle_id uuid,
  p_ip_hash text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.vehicle_views
    WHERE vehicle_id = p_vehicle_id
      AND (
        (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash) OR
        (p_user_id IS NOT NULL AND user_id = p_user_id)
      )
      AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.vehicle_views (vehicle_id, ip_hash, user_id)
    VALUES (p_vehicle_id, p_ip_hash, p_user_id);

    UPDATE public.vehicles
    SET views_count = views_count + 1
    WHERE id = p_vehicle_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_vehicle_view(uuid, text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_vehicle_view(uuid, text, uuid) TO service_role;

-- Expose the lead archive task to trusted service-role callers such as the
-- Supabase Edge cleanup worker without granting browser clients access to the
-- private schema function.
CREATE OR REPLACE FUNCTION public.archive_old_leads(
  p_days_old integer DEFAULT 90
)
RETURNS TABLE (archived_count integer, deleted_count integer)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT * FROM app_private.archive_old_leads(p_days_old);
$$;

REVOKE ALL ON FUNCTION public.archive_old_leads(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_old_leads(integer) TO service_role;

-- Replace the old onboarding legal version label if this migration is applied
-- over an existing development database.
UPDATE public.legal_acceptances
SET version = 'vendor-agreement-v1'
WHERE document_slug = 'vendor-agreement'
  AND version = 'production-placeholder-v1';

-- Unschedule the lead archive cron job if it exists (e.g. re-running migration or renaming).
-- Note: the job was scheduled as 'archive-expired-leads' in 20260601100000.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'archive-expired-leads'
  ) THEN
    PERFORM cron.unschedule('archive-expired-leads');
  END IF;
  -- Also clean up legacy name in case it was previously deployed differently.
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'delete-expired-leads'
  ) THEN
    PERFORM cron.unschedule('delete-expired-leads');
  END IF;
END;
$$;
