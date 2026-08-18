import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('iv_locations').upsert({ user_id: '8ff3b5d2-0b2a-4a25-83c9-0a6f8b1c4e9d', iv_trip_id: 'c82736b0-7b24-4f0e-85e8-5b4d7f5a3a2d', lat: 10, lng: 10 }, { onConflict: 'user_id,iv_trip_id' });
  console.log('Error:', error);
}
test();
