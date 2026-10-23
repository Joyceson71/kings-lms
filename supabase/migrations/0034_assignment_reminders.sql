CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_reminders boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their notification preferences"
  ON public.notification_preferences;

CREATE POLICY "Users manage their notification preferences"
  ON public.notification_preferences FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_offset smallint NOT NULL CHECK (reminder_offset IN (2, 24)),
  channel text NOT NULL CHECK (channel IN ('push', 'email')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id, reminder_offset, channel)
);

ALTER TABLE public.reminders_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to sent reminder ledger"
  ON public.reminders_sent;

CREATE POLICY "No direct access to sent reminder ledger"
  ON public.reminders_sent FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS reminders_sent_user_sent_idx
  ON public.reminders_sent(user_id, sent_at DESC);