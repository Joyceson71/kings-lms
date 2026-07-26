-- SOS events
CREATE TABLE IF NOT EXISTS iv_sos_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id    UUID NOT NULL REFERENCES iv_trips(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Group chat messages
CREATE TABLE IF NOT EXISTS iv_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id    UUID NOT NULL REFERENCES iv_trips(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT,
  photo_url     TEXT,
  is_broadcast  BOOLEAN DEFAULT false,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Location path history (for playback/heatmap)
CREATE TABLE IF NOT EXISTS iv_location_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id    UUID NOT NULL REFERENCES iv_trips(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT now()
);

-- Geofence zones (polygon support)
CREATE TABLE IF NOT EXISTS iv_geofence_zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id    UUID NOT NULL REFERENCES iv_trips(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  zone_type     TEXT NOT NULL CHECK (zone_type IN ('permitted','restricted','danger')),
  polygon       JSONB NOT NULL,  -- Array of {lat, lng} points
  created_by    UUID NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Geofence breach events
CREATE TABLE IF NOT EXISTS iv_geofence_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id       UUID NOT NULL REFERENCES iv_geofence_zones(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (event_type IN ('enter','exit')),
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'iv_sos_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE iv_sos_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'iv_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE iv_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'iv_geofence_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE iv_geofence_events;
  END IF;
END $$;

-- RLS
ALTER TABLE iv_sos_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_geofence_zones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_geofence_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_iv_sos" ON iv_sos_events;
CREATE POLICY "auth_all_iv_sos" ON iv_sos_events FOR ALL USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "auth_all_iv_messages" ON iv_messages;
CREATE POLICY "auth_all_iv_messages" ON iv_messages FOR ALL USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "auth_all_iv_history" ON iv_location_history;
CREATE POLICY "auth_all_iv_history" ON iv_location_history FOR ALL USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "auth_all_iv_zones" ON iv_geofence_zones;
CREATE POLICY "auth_all_iv_zones" ON iv_geofence_zones FOR ALL USING (auth.role()='authenticated');

DROP POLICY IF EXISTS "auth_all_iv_gevents" ON iv_geofence_events;
CREATE POLICY "auth_all_iv_gevents" ON iv_geofence_events FOR ALL USING (auth.role()='authenticated');

-- Index for fast path playback queries
CREATE INDEX IF NOT EXISTS idx_iv_loc_history ON iv_location_history (iv_trip_id, user_id, recorded_at);

-- Modify existing tables
ALTER TABLE iv_locations ADD COLUMN IF NOT EXISTS bearing REAL;
ALTER TABLE iv_locations ADD COLUMN IF NOT EXISTS speed REAL;
ALTER TABLE iv_locations ADD COLUMN IF NOT EXISTS power_saving BOOLEAN DEFAULT false;

ALTER TABLE iv_trips ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN DEFAULT false;
ALTER TABLE iv_trips ADD COLUMN IF NOT EXISTS map_pois JSONB DEFAULT '[]';
ALTER TABLE iv_trips ADD COLUMN IF NOT EXISTS attendance_session_id UUID REFERENCES attendance_sessions(id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
