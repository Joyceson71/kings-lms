-- ============================================================
-- 0015_grade_submissions.sql
-- Creates submissions table for faculty grading
-- ============================================================

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade INTEGER CHECK (grade >= 0 AND grade <= 100),
  feedback TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Index for fast lookups by student
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
DROP POLICY IF EXISTS "Students can view own submissions." ON public.submissions;
CREATE POLICY "Students can view own submissions."
  ON public.submissions FOR SELECT
  USING (auth.uid() = student_id);

-- Faculty/Admin can view all submissions
DROP POLICY IF EXISTS "Faculty can view all submissions." ON public.submissions;
CREATE POLICY "Faculty can view all submissions."
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('faculty', 'admin')
    )
  );

-- Faculty/Admin can insert and update grades
DROP POLICY IF EXISTS "Faculty can upsert submissions." ON public.submissions;
CREATE POLICY "Faculty can upsert submissions."
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('faculty', 'admin')
    )
  );

DROP POLICY IF EXISTS "Faculty can update submissions." ON public.submissions;
CREATE POLICY "Faculty can update submissions."
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('faculty', 'admin')
    )
  );
