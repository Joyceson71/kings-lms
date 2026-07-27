import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake_key';

// Read from .env.local if possible
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.from('iv_locations').select('*');
  if (error) {
    console.error('Error fetching iv_locations:', error);
  } else {
    console.log('Total iv_locations:', data?.length);
    console.log(JSON.stringify(data?.slice(0, 3), null, 2));
  }
}

main();
