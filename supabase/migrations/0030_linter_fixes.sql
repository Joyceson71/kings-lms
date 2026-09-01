-- 0030_linter_fixes.sql
-- Fixes Supabase linter warnings regarding search_path mutability and SECURITY DEFINER scopes

-- 1. Redefine helper functions to be SECURITY INVOKER instead of SECURITY DEFINER.
-- This removes the "Public Can Execute SECURITY DEFINER Function" warnings
-- while maintaining the exact same RLS capabilities, as the underlying tables
-- already allow the user to read their own data via their respective RLS policies.
-- We also explicitly set search_path = '' to prevent search_path mutability warnings.

CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY INVOKER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = p_course_id AND student_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_course_faculty(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY INVOKER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = p_course_id AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_quiz_creator(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY INVOKER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = p_quiz_id AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_module_resource(p_module_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY INVOKER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.modules m
    WHERE m.id = p_module_id AND (
      public.is_enrolled_in_course(m.course_id) OR public.is_course_faculty(m.course_id)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_taking_quiz(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY INVOKER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts 
    WHERE quiz_id = p_quiz_id AND student_id = auth.uid() AND status = 'in_progress'
  );
$$;

-- 2. Fix search_path mutability warnings for existing triggers/functions from 0028

CREATE OR REPLACE FUNCTION public.increment_xp(p_student_id UUID, p_xp INT) 
RETURNS void 
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_xp (student_id, total_xp, current_level)
  VALUES (p_student_id, p_xp, 1)
  ON CONFLICT (student_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_xp,
    current_level = CASE
      WHEN user_xp.total_xp + p_xp < 500 THEN 1
      WHEN user_xp.total_xp + p_xp < 1500 THEN 2
      WHEN user_xp.total_xp + p_xp < 3500 THEN 3
      WHEN user_xp.total_xp + p_xp < 7000 THEN 4
      ELSE 5
    END,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_attendance_summary() 
RETURNS trigger 
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.attendance_summary (student_id, course_id, total_sessions, attended, attendance_pct)
  SELECT 
    NEW.student_id,
    s.course_id,
    COUNT(DISTINCT ar.session_id),
    COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.session_id END),
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.session_id END) / 
      NULLIF(COUNT(DISTINCT ar.session_id), 0), 2)
  FROM public.attendance_records ar
  JOIN public.attendance_sessions s ON ar.session_id = s.id
  WHERE ar.student_id = NEW.student_id AND s.course_id = (
    SELECT course_id FROM public.attendance_sessions WHERE id = NEW.session_id
  )
  GROUP BY NEW.student_id, s.course_id
  ON CONFLICT (student_id, course_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    attended = EXCLUDED.attended,
    attendance_pct = EXCLUDED.attendance_pct,
    last_updated = NOW();
  RETURN NEW;
END;
$$;
