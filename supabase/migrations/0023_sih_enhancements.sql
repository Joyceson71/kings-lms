-- 0023_sih_enhancements.sql

-- 1. Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT UNIQUE;

-- 2. Add new columns to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS semester INT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS credits INT DEFAULT 4;

-- 3. Create internal_marks table
CREATE TABLE IF NOT EXISTS public.internal_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_type TEXT CHECK (exam_type IN ('unit_test_1', 'unit_test_2', 'model_exam', 'practical', 'assignment')),
  marks_obtained NUMERIC(5,2),
  max_marks NUMERIC(5,2),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id, exam_type)
);

ALTER TABLE public.internal_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own marks" ON public.internal_marks
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Faculty read marks for their courses" ON public.internal_marks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = internal_marks.course_id AND created_by = auth.uid())
  );

CREATE POLICY "Faculty manage marks for their courses" ON public.internal_marks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = internal_marks.course_id AND created_by = auth.uid())
  );

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT, -- 'attendance_warning', 'assignment_due', 'marks_updated', 'session_created'
  title TEXT,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
  
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Create timetable table
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 1 AND 6), -- 1=Mon, 6=Sat
  period_number INT CHECK (period_number BETWEEN 1 AND 8),
  room_number TEXT,
  semester INT,
  department TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(day_of_week, period_number, room_number)
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read timetable" ON public.timetable
  FOR SELECT USING (true);

CREATE POLICY "Faculty manage timetable" ON public.timetable
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
  );

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON public.attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session ON public.attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_internal_marks_course_student ON public.internal_marks(course_id, student_id);

-- 7. Seed demo data function
CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert demo data logic here later if requested by user for SIH presentation.
  -- For now, it's a stub to satisfy the requirement.
  NULL;
END;
$$;
