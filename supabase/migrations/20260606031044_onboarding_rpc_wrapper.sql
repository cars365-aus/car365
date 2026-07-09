CREATE OR REPLACE FUNCTION public.create_vendor_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_business_name text,
  p_slug text,
  p_abn text,
  p_website text,
  p_address text,
  p_city text,
  p_state text,
  p_branch_slug text
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT app_private.create_vendor_onboarding(
    p_user_id,
    p_full_name,
    p_email,
    p_phone,
    p_business_name,
    p_slug,
    p_abn,
    p_website,
    p_address,
    p_city,
    p_state,
    p_branch_slug
  );
$$;

REVOKE ALL ON FUNCTION public.create_vendor_onboarding(uuid, text, text, text, text, text, text, text, text, text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_vendor_onboarding(uuid, text, text, text, text, text, text, text, text, text, text, text) TO service_role;
