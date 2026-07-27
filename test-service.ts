import { createClient } from '@supabase/supabase-js';

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase.from('iv_locations').select('*');
  console.log('Service Role fetch:', error ? error : `Found ${data?.length} locations`);
}

main();
