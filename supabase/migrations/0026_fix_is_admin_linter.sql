-- 0026_fix_is_admin_linter.sql
-- Fix: authenticated_security_definer_function_executable for public.is_admin()
-- 
-- The linter warns about public.is_admin() being SECURITY DEFINER.
-- We cannot simply revoke EXECUTE from authenticated because RLS policies need it.
-- We cannot change it directly to SECURITY INVOKER because querying public.profiles inside it causes infinite recursion with RLS.
-- Solution: Proxy the function through a private schema.
-- public.is_admin() becomes SECURITY INVOKER (satisfying the linter).
-- private.is_admin() does the actual check as SECURITY DEFINER (hidden from the API).

CREATE SCHEMA IF NOT EXISTS private;

-- 1. Create the actual checking logic in the private schema
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Allow authenticated users to execute the private function via the public proxy
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- 2. Update the public function to be SECURITY INVOKER and proxy to the private one
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.is_admin();
$$;

-- Ensure authenticated users can execute the public proxy
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
