CREATE TABLE IF NOT EXISTS public.global_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Messages are viewable by everyone." ON public.global_messages;
CREATE POLICY "Messages are viewable by everyone." 
    ON public.global_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own messages." ON public.global_messages;
CREATE POLICY "Users can insert their own messages." 
    ON public.global_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any messages." ON public.global_messages;
CREATE POLICY "Admins can delete any messages." 
    ON public.global_messages FOR DELETE USING (public.is_admin());

-- Enable Realtime for global_messages
-- Postgres 15+ allows adding tables to publications dynamically if not already added
-- Usually Supabase uses the 'supabase_realtime' publication for realtime changes
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'global_messages'
    ) THEN
      -- If the publication exists, we add the table to it
      IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
      END IF;
    END IF;
  END
  $$;
COMMIT;
