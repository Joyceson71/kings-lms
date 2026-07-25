-- Add geofencing columns to course_sessions
ALTER TABLE public.course_sessions
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN radius_meters INTEGER;
