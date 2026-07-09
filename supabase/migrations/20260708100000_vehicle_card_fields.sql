-- Per-listing trust/inclusion flags surfaced on the marketplace vehicle card.
-- Additive only: existing listings default to false (toggles off) and simply
-- render no chip until the vendor opts in. No backfill required.
ALTER TABLE "public"."vehicles"
  ADD COLUMN IF NOT EXISTS "free_delivery"     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "free_cancellation" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "no_hidden_fees"    boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."vehicles"."free_delivery" IS 'Vendor offers free delivery of this vehicle to the renter.';
COMMENT ON COLUMN "public"."vehicles"."free_cancellation" IS 'This listing offers free cancellation (shown as a trust chip on the card).';
COMMENT ON COLUMN "public"."vehicles"."no_hidden_fees" IS 'Vendor guarantees no hidden fees for this listing (trust chip on the card).';
