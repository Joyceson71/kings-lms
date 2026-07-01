import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    SUPABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].replace(/"/g, '').trim();
  }
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedUsers() {
  const users = [
    { email: 'student@kingsecc.in', password: 'student123', name: 'Arun K.', role: 'student' },
    { email: 'faculty@kingsecc.in', password: 'faculty123', name: 'Joyceson D.', role: 'faculty' },
    { email: 'admin@kingsecc.in', password: 'admin123', name: 'System Admin', role: 'admin' },
  ];

  for (const u of users) {
    console.log(`Processing ${u.email}...`);
    
    // Check if user exists
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.find(ex => ex.email === u.email);
    
    let userId;
    
    if (existing) {
      console.log(`User ${u.email} already exists. Updating password...`);
      userId = existing.id;
      await supabase.auth.admin.updateUserById(userId, {
        password: u.password,
        user_metadata: { full_name: u.name }
      });
    } else {
      console.log(`Creating user ${u.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name }
      });
      
      if (error) {
        console.error(`Failed to create ${u.email}:`, error.message);
        continue;
      }
      userId = data.user.id;
    }

    // Try to update profiles table if it exists
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: u.name,
      role: u.role
    });
    
    if (profileError) {
      console.log(`Profile table sync skipped/failed: ${profileError.message} (This is normal if the table doesn't exist yet)`);
    } else {
      console.log(`Profile synced for ${u.email}`);
    }
  }
  console.log('Seed completed!');
}

seedUsers().catch(console.error);
