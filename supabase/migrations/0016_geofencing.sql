-- Add geofencing columns to course_sessions
ALTER TABLE public.course_sessions
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS radius_meters INTEGER;
