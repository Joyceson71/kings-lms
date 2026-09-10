import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually to avoid needing dotenv
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const cleanLine = line.replace('\r', '').trim();
  if (cleanLine.startsWith('#') || !cleanLine) return;
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function seed() {
  console.log("Starting to seed 1000 users...");
  const total = 1000;
  const batchSize = 10;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < total; i += batchSize) {
    const promises = [];
    for (let j = 0; j < batchSize && i + j < total; j++) {
      const index = i + j + 1;
      const email = `student${index}@kingsedu.ac.in`;
      const password = 'Password123!';
      const fullName = `Test Student ${index}`;
      const rollNumber = `2024TEST${index.toString().padStart(4, '0')}`;
      
      promises.push((async () => {
        try {
          // 1. Create User in Auth
          const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
          });

          if (error) {
             // If user already exists, that's fine, we try to fetch them
             if (error.status === 422 || error.message.includes("already exists")) {
               console.log(`[Skip] User ${email} already exists`);
               return;
             }
             throw error;
          }

          const userId = data.user.id;

          // 2. Create Profile
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            role: 'student',
            department: 'CSE', // Assuming CSE exists
            roll_number: rollNumber,
            onboarding_complete: true,
          });

          if (profileError) {
             throw profileError;
          }
          
          successCount++;
        } catch (err) {
          console.error(`Failed for student${index}:`, err.message || err);
          failureCount++;
        }
      })());
    }
    
    await Promise.all(promises);
    console.log(`Processed ${Math.min(i + batchSize, total)} / ${total} users...`);
  }

  console.log(`\nSeeding complete! Successfully created: ${successCount}. Failures: ${failureCount}.`);
}

seed().catch(console.error);
