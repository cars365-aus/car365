ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS bio text;

COMMENT ON COLUMN public.organizations.logo_url IS 'Public URL of the vendor brand logo';
COMMENT ON COLUMN public.organizations.bio IS 'Public biography or description of the vendor';
