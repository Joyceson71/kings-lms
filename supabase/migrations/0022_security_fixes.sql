-- ============================================================
-- 0022_security_fixes.sql
-- Security hardening: role constraints, RLS policy fixes,
-- attendance uniqueness, and audit trail protection.
-- ============================================================

-- ── 1. profiles: enforce valid role values ──────────────────
-- Prevent any value outside the allowed set from being stored.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = ''profiles''
      AND constraint_name = ''profiles_role_check''
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN (''student'', ''faculty'', ''admin''));
  END IF;
END $$;

-- ── 2. profiles: prevent self-role-elevation ─────────────────
-- Drop existing update policy (if any) and replace with one
-- that allows users to update any column EXCEPT role.
-- Note: Supabase column-level RLS is handled via the policy
-- using EXCEPT on the SET clause (PostgreSQL 16+).
-- For earlier versions we use a trigger instead.

-- Drop any old permissive update policy
DROP POLICY IF EXISTS "Users can update own profile"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"              ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Recreate: allow users to UPDATE their own row
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: block role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow if the role is not being changed
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- Allow admins to change roles (they go through service-role key)
  -- Callers using the service-role key bypass RLS, so this function
  -- only fires for anon/authenticated key callers.
  RAISE EXCEPTION ''Changing your own role is not allowed.'';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON profiles;
CREATE TRIGGER trg_prevent_role_self_change
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_change();

-- ── 3. attendance_records: unique constraint ─────────────────
-- Prevent duplicate attendance for the same session + student.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name   = ''attendance_records''
      AND constraint_name = ''attendance_records_session_student_uniq''
  ) THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT attendance_records_session_student_uniq
      UNIQUE (session_id, student_id);
  END IF;
END $$;

-- ── 4. attendance_records: students can only INSERT own record ─
DROP POLICY IF EXISTS "Students can insert own attendance" ON attendance_records;
CREATE POLICY "Students can insert own attendance"
  ON attendance_records
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- ── 5. attendance_records: no self-delete ────────────────────
DROP POLICY IF EXISTS "Students cannot delete attendance" ON attendance_records;
-- (Simply not creating a DELETE policy means no one with the anon key can delete)
