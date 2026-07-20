-- 0013_add_missing_rls_policies.sql
-- Fixes rls_enabled_no_policy warnings for tables created via the dashboard.

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'achievements', 
        'admins', 
        'attendance', 
        'faculty', 
        'learning_progress', 
        'results', 
        'students', 
        'study_groups', 
        'subjects'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Check if the table actually exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- Ensure RLS is enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            
            -- Drop existing policy if any (just in case)
            EXECUTE format('DROP POLICY IF EXISTS "Admins have full access to %I" ON public.%I;', t, t);
            
            -- Create a single admin-only policy to satisfy the linter and lock it down securely
            EXECUTE format('CREATE POLICY "Admins have full access to %I" ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());', t, t);
            
        END IF;
    END LOOP;
END $$;
