-- Location pings (one live row per student, upserted every 5s)
CREATE TABLE IF NOT EXISTS iv_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  iv_trip_id   UUID NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  accuracy     REAL,
  battery      SMALLINT,
  is_online    BOOLEAN DEFAULT true,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, iv_trip_id)
);

-- Broadcast alerts (admin sends "gather here" with a pin)
CREATE TABLE IF NOT EXISTS iv_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iv_trip_id   UUID NOT NULL,
  sent_by      UUID NOT NULL REFERENCES profiles(id),
  message      TEXT NOT NULL,
  gather_lat   DOUBLE PRECISION,
  gather_lng   DOUBLE PRECISION,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- IV trips (admin creates before the visit; students join by trip code)
CREATE TABLE IF NOT EXISTS iv_trips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  trip_code    TEXT NOT NULL UNIQUE,
  created_by   UUID NOT NULL REFERENCES profiles(id),
  map_bounds   JSONB,  -- {north, south, east, west} for tile pre-cache
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Push subscriptions (one per device per user)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,  -- Web Push subscription object
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime on iv_locations and iv_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE iv_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE iv_alerts;

-- RLS policies
ALTER TABLE iv_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE iv_trips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- iv_locations: students write their own row; everyone on the trip can read
CREATE POLICY "student_upsert_own_location" ON iv_locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "all_authenticated_read_locations" ON iv_locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- iv_alerts: faculty/admin write; everyone on the trip can read
CREATE POLICY "faculty_admin_write_alerts" ON iv_alerts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty','admin'))
  );
CREATE POLICY "trip_members_read_alerts" ON iv_alerts
  FOR SELECT USING (true);

-- iv_trips: faculty/admin manage; all authenticated read
CREATE POLICY "faculty_admin_manage_trips" ON iv_trips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty','admin'))
  );
CREATE POLICY "all_authenticated_read_trips" ON iv_trips
  FOR SELECT USING (auth.role() = 'authenticated');

-- push_subscriptions: own row only
CREATE POLICY "own_push_sub" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
