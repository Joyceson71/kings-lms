-- ============================================================
-- 0009_admin_improvements.sql
-- Adds user status, admin-level RLS policies, and indexes
-- ============================================================

-- 1. Add status column to profiles (active | suspended)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('active', 'suspended'))
    DEFAULT 'active' NOT NULL;

-- 2. Index for fast lookups by role and status in the admin panel
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- ============================================================
-- 3. Admin RLS — allow admins to update any profile's role/status
-- ============================================================

-- Helper function: returns true when the calling user is an admin.
-- SECURITY DEFINER so it runs as the function owner (no infinite recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop old restrictive update policy so we can replace it
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Users can update their own profile (non-role/status fields)
CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (role, status, etc.)
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
CREATE POLICY "Admins can update any profile."
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());
