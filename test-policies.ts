import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    },
    body: JSON.stringify({
      query: "SELECT * FROM pg_policies WHERE tablename = 'iv_locations';"
    })
  });
  
  if (!response.ok) {
     console.error('RPC failed, trying a direct POST if there is an endpoint');
  } else {
     const data = await response.json();
     console.log(JSON.stringify(data, null, 2));
  }
}
main();
