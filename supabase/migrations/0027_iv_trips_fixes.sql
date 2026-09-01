ALTER TABLE "public"."iv_trips" ADD COLUMN IF NOT EXISTS "map_bounds" jsonb;
ALTER TABLE "public"."iv_trips" ADD COLUMN IF NOT EXISTS "trip_code" text;
ALTER TABLE "public"."iv_trips" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
