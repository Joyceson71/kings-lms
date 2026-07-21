-- 0014_live_class_pulse.sql
-- Adds the pulse_signals table for real-time anonymous student engagement
-- during active attendance sessions (confused / got_it / question signals).

CREATE TABLE IF NOT EXISTS public.pulse_signals (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
    signal      TEXT NOT NULL CHECK (signal IN ('confused', 'got_it', 'question')),
    sent_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    -- Intentionally no student_id — signals are fully anonymous.
);

-- Enable RLS
ALTER TABLE public.pulse_signals ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can INSERT a signal (enforced at app level to enrolled students)
DROP POLICY IF EXISTS "Authenticated users can send pulse signals." ON public.pulse_signals;
CREATE POLICY "Authenticated users can send pulse signals."
    ON public.pulse_signals
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Anyone authenticated can SELECT signals (faculty need to read them in realtime)
DROP POLICY IF EXISTS "Authenticated users can view pulse signals." ON public.pulse_signals;
CREATE POLICY "Authenticated users can view pulse signals."
    ON public.pulse_signals
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enable Realtime so the faculty Pulse Panel updates instantly
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = 'pulse_signals'
    ) THEN
      IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_signals;
      END IF;
    END IF;
  END
  $$;
COMMIT;
