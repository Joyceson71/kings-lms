-- Fix: function_search_path_mutable
-- Ensure all functions have a set search_path
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.seed_demo_data() SET search_path = public;
ALTER FUNCTION public.prevent_role_self_change() SET search_path = public;
ALTER FUNCTION public.match_course_materials(vector, double precision, integer, uuid[]) SET search_path = public;

-- Fix: extension_in_public
-- Move vector extension to 'extensions' schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
-- Ensure we can still use it without qualifying 'extensions.'
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Fix: public_bucket_allows_listing
-- Drop the broad SELECT policy on the public bucket 'iv_photos'.
-- Public buckets don't need a SELECT policy on storage.objects for users to download objects via public URLs.
DROP POLICY IF EXISTS "Anyone can view iv_photos" ON storage.objects;

-- Fix: anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- Revoke execute from PUBLIC and anon for all these functions so they aren't exposed to the unauthenticated API.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

REVOKE EXECUTE ON FUNCTION public.seed_demo_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_demo_data() FROM anon;
REVOKE EXECUTE ON FUNCTION public.seed_demo_data() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM authenticated;
