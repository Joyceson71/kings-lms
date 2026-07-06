-- 1. Create course_sessions table
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.course_sessions CASCADE;

CREATE TABLE IF NOT EXISTS public.course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    room TEXT,
    status TEXT DEFAULT 'active', -- 'active' or 'closed'
    qr_token TEXT NOT NULL UNIQUE, -- A random secure token that changes per session
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional: automatically close session after some time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at on course_sessions
DROP TRIGGER IF EXISTS on_course_sessions_updated ON public.course_sessions;
CREATE TRIGGER on_course_sessions_updated
    BEFORE UPDATE ON public.course_sessions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Create attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Present', -- 'Present', 'Late', 'Excused', etc.
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent a student from marking attendance multiple times for the same session
    UNIQUE(session_id, student_id)
);

-- 3. RLS Policies for course_sessions
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- Faculty can read sessions for courses they teach
DROP POLICY IF EXISTS "Faculty can read their course sessions" ON public.course_sessions;
CREATE POLICY "Faculty can read their course sessions" ON public.course_sessions FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_sessions.course_id AND created_by = auth.uid())
);

-- Students can read active sessions for courses they are enrolled in
DROP POLICY IF EXISTS "Students can read active course sessions" ON public.course_sessions;
CREATE POLICY "Students can read active course sessions" ON public.course_sessions FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = course_sessions.course_id AND student_id = auth.uid())
);

-- Faculty can create sessions
DROP POLICY IF EXISTS "Faculty can create sessions" ON public.course_sessions;
CREATE POLICY "Faculty can create sessions" ON public.course_sessions FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

-- Faculty can update their sessions (e.g. to close them)
DROP POLICY IF EXISTS "Faculty can update their sessions" ON public.course_sessions;
CREATE POLICY "Faculty can update their sessions" ON public.course_sessions FOR UPDATE USING (
    created_by = auth.uid()
);

-- 4. RLS Policies for attendance_logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Faculty can read attendance logs for their sessions
DROP POLICY IF EXISTS "Faculty can read attendance logs" ON public.attendance_logs;
CREATE POLICY "Faculty can read attendance logs" ON public.attendance_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_sessions WHERE id = attendance_logs.session_id AND created_by = auth.uid())
);

-- Students can read their own attendance logs
DROP POLICY IF EXISTS "Students can read own attendance logs" ON public.attendance_logs;
CREATE POLICY "Students can read own attendance logs" ON public.attendance_logs FOR SELECT USING (
    student_id = auth.uid()
);

-- Students can insert an attendance log (mark attendance)
DROP POLICY IF EXISTS "Students can mark attendance" ON public.attendance_logs;
CREATE POLICY "Students can mark attendance" ON public.attendance_logs FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.course_sessions 
        WHERE id = attendance_logs.session_id 
        AND status = 'active'
    )
);
