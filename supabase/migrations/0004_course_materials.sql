-- 1. Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'PDF', 'Video', 'Archive', 'Link', etc.
    file_path TEXT,     -- Path in Supabase Storage or external URL
    size TEXT,          -- Display size like '2.4 MB'
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_course_materials_updated ON public.course_materials;
CREATE TRIGGER on_course_materials_updated
    BEFORE UPDATE ON public.course_materials
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. RLS Policies for course_materials
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Students can read materials for their courses
DROP POLICY IF EXISTS "Students can view materials for enrolled courses." ON public.course_materials;
CREATE POLICY "Students can view materials for enrolled courses." ON public.course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = public.course_materials.course_id AND student_id = auth.uid())
);

-- Faculty can read materials for their courses
DROP POLICY IF EXISTS "Faculty can view materials for their courses." ON public.course_materials;
CREATE POLICY "Faculty can view materials for their courses." ON public.course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can insert materials for their courses
DROP POLICY IF EXISTS "Faculty can insert materials." ON public.course_materials;
CREATE POLICY "Faculty can insert materials." ON public.course_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can update materials for their courses
DROP POLICY IF EXISTS "Faculty can update materials." ON public.course_materials;
CREATE POLICY "Faculty can update materials." ON public.course_materials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can delete materials for their courses
DROP POLICY IF EXISTS "Faculty can delete materials." ON public.course_materials;
CREATE POLICY "Faculty can delete materials." ON public.course_materials FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- 3. Storage Setup for 'course_materials' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course_materials', 'course_materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
-- Note: 'course_materials' bucket allows public read since we handle authorization in the UI/signed URLs
-- For a strict setup, we'd check auth.uid(), but Supabase storage policies can be complex with foreign keys.
-- For this prototype, we'll allow authenticated users to upload and anyone to read (bucket is public).

DROP POLICY IF EXISTS "Materials are publicly accessible." ON storage.objects;
CREATE POLICY "Materials are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'course_materials' );

DROP POLICY IF EXISTS "Authenticated users can upload materials." ON storage.objects;
CREATE POLICY "Authenticated users can upload materials."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'course_materials' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update their materials." ON storage.objects;
CREATE POLICY "Authenticated users can update their materials."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'course_materials' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Authenticated users can delete their materials." ON storage.objects;
CREATE POLICY "Authenticated users can delete their materials."
ON storage.objects FOR DELETE
USING ( bucket_id = 'course_materials' AND auth.uid() = owner );
