-- Add photo_url to arrivals
ALTER TABLE iv_checkpoint_arrivals ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- We need an UPDATE policy so users can attach a photo after the automatic insert
DROP POLICY IF EXISTS "student_update_own_arrival" ON iv_checkpoint_arrivals;
CREATE POLICY "student_update_own_arrival" ON iv_checkpoint_arrivals
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for IV Checkpoint Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('iv_photos', 'iv_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for iv_photos
DROP POLICY IF EXISTS "Anyone can view iv_photos" ON storage.objects;
CREATE POLICY "Anyone can view iv_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'iv_photos');

DROP POLICY IF EXISTS "Authenticated users can upload iv_photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload iv_photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'iv_photos' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own iv_photos" ON storage.objects;
CREATE POLICY "Users can update their own iv_photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'iv_photos' AND auth.uid() = owner
  );
