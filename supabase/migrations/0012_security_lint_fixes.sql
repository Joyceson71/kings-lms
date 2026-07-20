-- Migration to fix Supabase Linter warnings for security and RLS

-- 1. function_search_path_mutable
-- Enforce a specific search_path for security definer functions to prevent search path hijacking.
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- For functions that might have been created via dashboard and not in migrations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'touch_updated_at' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_profile_role') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'current_profile_role' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_faculty') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'is_faculty' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'log_audit_event' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace
        );
    END IF;
END
$$;

-- 2. anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- Revoke EXECUTE from anon and authenticated for internal functions (triggers).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- For is_admin(), it is used by the frontend via RPC and internally for RLS. 
-- It shouldn't be executed by anonymous users.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Revoke for other dashboard-created functions if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        EXECUTE (
            SELECT 'REVOKE EXECUTE ON FUNCTION ' || oid::regprocedure || ' FROM anon, authenticated;'
            FROM pg_proc WHERE proname = 'log_audit_event' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE (
            SELECT 'REVOKE EXECUTE ON FUNCTION ' || oid::regprocedure || ' FROM anon, authenticated;'
            FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace
        );
    END IF;
END
$$;

-- 3. rls_policy_always_true
-- Drop the overly permissive auto-generated policies.
DROP POLICY IF EXISTS "Allow all operations for admins" ON public.admins;
DROP POLICY IF EXISTS "Allow all operations for departments" ON public.departments;
DROP POLICY IF EXISTS "Allow all operations for faculty" ON public.faculty;
DROP POLICY IF EXISTS "Allow all operations for students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations for subjects" ON public.subjects;

-- 4. public_bucket_allows_listing
-- "course_materials" has a broad SELECT policy on storage.objects allowing listing.
-- Public buckets do not need SELECT policies for objects to be downloaded.
DROP POLICY IF EXISTS "Materials are publicly accessible." ON storage.objects;

-- 5. extension_in_public
-- Move moddatetime to extensions schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'moddatetime' AND extnamespace = 'public'::regnamespace) THEN
        ALTER EXTENSION moddatetime SET SCHEMA extensions;
    END IF;
END
$$;
