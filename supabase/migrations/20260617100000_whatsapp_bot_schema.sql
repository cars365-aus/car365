-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookups by phone
CREATE INDEX IF NOT EXISTS idx_support_tickets_phone ON public.support_tickets(customer_phone);

-- Setup RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tickets
CREATE POLICY "Admins can manage support tickets"
    ON public.support_tickets FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE email IN (
                -- Super admins (could use a roles table join in a real system)
                'admin@hirecarmarketplace.com.au'
            )
        ) OR EXISTS (
            SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND active = true
        )
    );

-- System can insert tickets (for webhooks)
CREATE POLICY "System can insert support tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (true);

-- Create WhatsApp sessions table for conversational state
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    phone TEXT PRIMARY KEY,
    state TEXT NOT NULL, -- e.g., 'awaiting_booking_id', 'awaiting_support_description'
    metadata JSONB, -- stores extra context like booking_id
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: whatsapp_sessions is only accessed via the service role key during webhook processing,
-- so RLS isn't strictly necessary, but we can enable it for safety.
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
