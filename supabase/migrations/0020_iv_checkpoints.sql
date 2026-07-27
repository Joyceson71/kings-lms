CREATE TABLE IF NOT EXISTS iv_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id UUID NOT NULL REFERENCES iv_trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_meters INTEGER DEFAULT 50,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iv_checkpoint_arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id UUID NOT NULL REFERENCES iv_checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  arrived_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(checkpoint_id, user_id)
);

-- Enable RLS
ALTER TABLE iv_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_checkpoint_arrivals ENABLE ROW LEVEL SECURITY;

-- Policies for iv_checkpoints
DROP POLICY IF EXISTS "auth_read_checkpoints" ON iv_checkpoints;
CREATE POLICY "auth_read_checkpoints" ON iv_checkpoints FOR SELECT USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "faculty_admin_manage_checkpoints" ON iv_checkpoints;
CREATE POLICY "faculty_admin_manage_checkpoints" ON iv_checkpoints 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty','admin'))
  );

-- Policies for iv_checkpoint_arrivals
DROP POLICY IF EXISTS "auth_read_arrivals" ON iv_checkpoint_arrivals;
CREATE POLICY "auth_read_arrivals" ON iv_checkpoint_arrivals FOR SELECT USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "student_upsert_own_arrival" ON iv_checkpoint_arrivals;
CREATE POLICY "student_upsert_own_arrival" ON iv_checkpoint_arrivals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
