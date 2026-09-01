-- 0029_optimize_rls_and_indexes.sql
-- Optimizes nested Subqueries in RLS using SECURITY DEFINER functions and adds missing indexes

-- ==========================================
-- 1. SECURITY DEFINER Helper Functions
-- ==========================================
-- Using STABLE functions allows PostgreSQL to cache the result per statement.
-- Using SECURITY DEFINER bypasses RLS during the check, preventing recursive slow-downs.

CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = p_course_id AND student_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_course_faculty(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = p_course_id AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_quiz_creator(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = p_quiz_id AND created_by = auth.uid()
  );
$$;

-- ==========================================
-- 2. Optimize RLS Policies
-- ==========================================

-- MODULES
DROP POLICY IF EXISTS "enrolled or faculty view modules" ON public.modules;
CREATE POLICY "enrolled or faculty view modules" ON public.modules FOR SELECT USING (
  public.is_enrolled_in_course(course_id) OR public.is_course_faculty(course_id)
);

DROP POLICY IF EXISTS "faculty manage modules" ON public.modules;
CREATE POLICY "faculty manage modules" ON public.modules FOR ALL USING (
  public.is_course_faculty(course_id)
);

-- RESOURCES
-- resources table doesn't have course_id directly, we must join or use a function.
CREATE OR REPLACE FUNCTION public.can_view_module_resource(p_module_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.modules m
    WHERE m.id = p_module_id AND (
      public.is_enrolled_in_course(m.course_id) OR public.is_course_faculty(m.course_id)
    )
  );
$$;

DROP POLICY IF EXISTS "view resources same as module" ON public.resources;
CREATE POLICY "view resources same as module" ON public.resources FOR SELECT USING (
  public.can_view_module_resource(module_id)
);

-- QUIZZES
DROP POLICY IF EXISTS "enrolled students view quizzes" ON public.quizzes;
CREATE POLICY "enrolled students view quizzes" ON public.quizzes FOR SELECT USING (
  public.is_enrolled_in_course(course_id) OR created_by = auth.uid()
);

-- QUESTIONS
CREATE OR REPLACE FUNCTION public.is_taking_quiz(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts 
    WHERE quiz_id = p_quiz_id AND student_id = auth.uid() AND status = 'in_progress'
  );
$$;

DROP POLICY IF EXISTS "student view questions during attempt" ON public.questions;
CREATE POLICY "student view questions during attempt" ON public.questions FOR SELECT USING (
  public.is_taking_quiz(quiz_id) OR public.is_quiz_creator(quiz_id)
);

-- ==========================================
-- 3. Add Missing Foreign Key Indexes
-- ==========================================
-- Proper indexing is crucial for JOIN performance and ON DELETE CASCADE operations.

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_module ON public.student_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_sub_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON public.quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_option ON public.quiz_answers(selected_option_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_uploader ON public.library_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_user_achievements_student ON public.user_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student ON public.attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_course ON public.attendance_summary(course_id);
