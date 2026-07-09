ALTER TABLE public.fraud_flags 
ADD COLUMN IF NOT EXISTS reviewed_by uuid references public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
