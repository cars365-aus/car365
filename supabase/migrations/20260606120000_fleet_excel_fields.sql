-- Add new fields for fleet excel import
ALTER TABLE "public"."vehicles"
ADD COLUMN IF NOT EXISTS "vin" text,
ADD COLUMN IF NOT EXISTS "license_plate" text,
ADD COLUMN IF NOT EXISTS "color" text,
ADD COLUMN IF NOT EXISTS "hourly_rate_aud" integer,
ADD COLUMN IF NOT EXISTS "weekly_rate_aud" integer,
ADD COLUMN IF NOT EXISTS "monthly_rate_aud" integer,
ADD COLUMN IF NOT EXISTS "weekend_rate_aud" integer,
ADD COLUMN IF NOT EXISTS "notes" text;

-- We don't make VIN strictly unique globally because a vendor might have archived it or another vendor might have claimed it in a disputed way,
-- but we can make it unique per organization for active fleet tracking.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_vehicles_vin_org" ON "public"."vehicles"("organization_id", "vin") WHERE "vin" IS NOT NULL;
