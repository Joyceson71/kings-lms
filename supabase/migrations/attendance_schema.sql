-- Phase 2: Smart Attendance System Schema

-- Clean up existing structures to avoid 'already exists' errors during testing
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;

-- 1. Attendance Sessions (Created by Faculty)
CREATE TABLE public.attendance_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER DEFAULT 50 NOT NULL,
    qr_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Attendance Records (Scanned by Students)
CREATE TABLE public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')) NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION, -- distance from the geofence center when marked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    -- Ensure a student can only have one record per session
    UNIQUE(session_id, student_id)
);

-- 3. Triggers for updated_at
CREATE TRIGGER handle_updated_at_attendance_sessions
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_attendance_records
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- 4. Indexes for optimization
CREATE INDEX idx_attendance_sessions_faculty ON public.attendance_sessions(faculty_id);
CREATE INDEX idx_attendance_sessions_subject ON public.attendance_sessions(subject_id);
CREATE INDEX idx_attendance_sessions_active ON public.attendance_sessions(is_active);
CREATE INDEX idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON public.attendance_records(student_id);

-- 5. Row Level Security (RLS) policies - Stubbed as Open for testing until Phase 3
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for attendance_sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
