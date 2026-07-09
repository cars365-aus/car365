-- Add customer_user_id column to leads and leads_archive
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.leads_archive ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create scaling index for customer_user_id lookup
CREATE INDEX IF NOT EXISTS idx_leads_customer_user_id ON public.leads(customer_user_id) WHERE customer_user_id IS NOT NULL;

-- Update archiving function to copy customer_user_id
CREATE OR REPLACE FUNCTION app_private.archive_old_leads(
  p_days_old integer default 90
)
returns table (archived_count integer, deleted_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_archived integer := 0;
  v_deleted integer := 0;
  v_cutoff_date timestamptz;
begin
  v_cutoff_date := now() - (p_days_old || ' days')::interval;

  -- Move leads older than cutoff to archive
  with archived as (
    delete from public.leads
    where created_at < v_cutoff_date
      and status in ('new', 'contacted', 'lost')
    returning *
  )
  insert into public.leads_archive (
    id, vendor_id, vehicle_id, customer_name, customer_email, customer_phone,
    pickup_city, start_date, end_date, message, status, ip_hash, created_at, updated_at,
    archived_at, archive_reason, customer_user_id
  )
  select 
    id, vendor_id, vehicle_id, customer_name, customer_email, customer_phone,
    pickup_city, start_date, end_date, message, status, ip_hash, created_at, updated_at,
    now(), 'expired after ' || p_days_old || ' days', customer_user_id
  from archived;

  get diagnostics v_archived = row_count;

  -- Log the archive action
  insert into public.audit_logs (action, resource_type, metadata)
  values ('leads_archived', 'system', jsonb_build_object(
    'archived_count', v_archived,
    'cutoff_days', p_days_old,
    'cutoff_date', v_cutoff_date
  ));

  return query select v_archived, v_deleted;
end;
$$;

-- Drop and recreate public.leads policies with case-insensitive and UUID checks
DROP POLICY IF EXISTS "members read own leads" ON public.leads;
CREATE POLICY "members read own leads" ON public.leads
FOR SELECT USING (
  customer_user_id = auth.uid()
  OR lower(customer_email) = (SELECT lower(email) FROM public.profiles WHERE id = auth.uid())
  OR app_private.is_org_member(vendor_id)
  OR app_private.is_platform_admin()
);

DROP POLICY IF EXISTS "members update own lead status" ON public.leads;
CREATE POLICY "members update own lead status" ON public.leads
FOR UPDATE USING (
  customer_user_id = auth.uid()
  OR lower(customer_email) = (SELECT lower(email) FROM public.profiles WHERE id = auth.uid())
  OR app_private.is_org_member(vendor_id)
  OR app_private.is_platform_admin()
)
WITH CHECK (
  customer_user_id = auth.uid()
  OR lower(customer_email) = (SELECT lower(email) FROM public.profiles WHERE id = auth.uid())
  OR app_private.is_org_member(vendor_id)
  OR app_private.is_platform_admin()
);

-- Drop and recreate public.messages policies with case-insensitive and UUID checks
DROP POLICY IF EXISTS "users can read messages for their leads" ON public.messages;
CREATE POLICY "users can read messages for their leads" ON public.messages
FOR SELECT USING (
  exists (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (
      l.customer_user_id = auth.uid()
      OR lower(l.customer_email) = (SELECT lower(email) FROM public.profiles WHERE id = auth.uid()) 
      OR app_private.is_org_member(l.vendor_id)
      OR app_private.is_platform_admin()
    )
  )
);

DROP POLICY IF EXISTS "users can insert messages for their leads" ON public.messages;
CREATE POLICY "users can insert messages for their leads" ON public.messages
FOR INSERT WITH CHECK (
  sender_user_id = auth.uid()
  AND exists (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (
      l.customer_user_id = auth.uid()
      OR lower(l.customer_email) = (SELECT lower(email) FROM public.profiles WHERE id = auth.uid()) 
      OR app_private.is_org_member(l.vendor_id)
    )
  )
);
