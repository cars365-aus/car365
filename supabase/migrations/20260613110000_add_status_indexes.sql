-- Add missing indexes for frequently filtered columns in home page statistical queries

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_branches_status ON public.branches(status);

-- We also frequently query by organization status in featured vehicles
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
