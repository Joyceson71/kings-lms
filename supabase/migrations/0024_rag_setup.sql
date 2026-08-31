-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the chunks table
CREATE TABLE IF NOT EXISTS public.course_material_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Gemini uses 768 dimensions for embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_course_material_chunks_course_id ON public.course_material_chunks(course_id);
CREATE INDEX IF NOT EXISTS idx_course_material_chunks_material_id ON public.course_material_chunks(material_id);
-- HNSW index for fast vector search
CREATE INDEX IF NOT EXISTS course_material_chunks_embedding_idx ON public.course_material_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.course_material_chunks ENABLE ROW LEVEL SECURITY;

-- Students can read chunks for their enrolled courses
DROP POLICY IF EXISTS "Students can view chunks for enrolled courses." ON public.course_material_chunks;
CREATE POLICY "Students can view chunks for enrolled courses." ON public.course_material_chunks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = public.course_material_chunks.course_id AND student_id = auth.uid())
);

-- Faculty can manage chunks for their courses
DROP POLICY IF EXISTS "Faculty can manage chunks for their courses." ON public.course_material_chunks;
CREATE POLICY "Faculty can manage chunks for their courses." ON public.course_material_chunks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = public.course_material_chunks.course_id AND faculty_id = auth.uid())
);

-- 5. Create the search function (RPC)
CREATE OR REPLACE FUNCTION public.match_course_materials(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_course_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  material_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    course_material_chunks.id,
    course_material_chunks.material_id,
    course_material_chunks.content,
    1 - (course_material_chunks.embedding <=> query_embedding) AS similarity
  FROM
    public.course_material_chunks
  WHERE
    course_material_chunks.course_id = ANY(filter_course_ids)
    AND 1 - (course_material_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY
    course_material_chunks.embedding <=> query_embedding
  LIMIT
    match_count;
END;
$$;
