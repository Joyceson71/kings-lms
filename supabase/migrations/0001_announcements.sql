-- 1. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, -- if null, global announcement
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_announcements_updated ON public.announcements;
CREATE TRIGGER on_announcements_updated
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Announcements RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Select policies
-- Students can see global announcements (course_id IS NULL) or announcements for courses they are enrolled in.
CREATE POLICY "Users can view relevant announcements." ON public.announcements FOR SELECT USING (
    course_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.course_enrollments 
        WHERE public.course_enrollments.course_id = public.announcements.course_id 
        AND public.course_enrollments.student_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE public.courses.id = public.announcements.course_id 
        AND public.courses.created_by = auth.uid()
    )
);

-- Insert policies
-- Admins can create global announcements. Faculty can create course-specific announcements.
CREATE POLICY "Admins can create global announcements." ON public.announcements FOR INSERT WITH CHECK (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can create course announcements." ON public.announcements FOR INSERT WITH CHECK (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Update and Delete policies
CREATE POLICY "Admins can update global announcements." ON public.announcements FOR UPDATE USING (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can update their course announcements." ON public.announcements FOR UPDATE USING (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

CREATE POLICY "Admins can delete global announcements." ON public.announcements FOR DELETE USING (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can delete their course announcements." ON public.announcements FOR DELETE USING (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);
