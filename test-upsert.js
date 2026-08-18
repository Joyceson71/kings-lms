import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('iv_locations').upsert({ user_id: '123', iv_trip_id: '123', lat: 0, lng: 0 }, { onConflict: 'user_id,iv_trip_id' });
  console.log('Error:', error);
}
test();
