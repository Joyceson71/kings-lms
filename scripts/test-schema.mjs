import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '0028_core_features.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// The SQL script might have multiple statements.
// Supabase JS doesn't support raw SQL execution directly except via RPC.
// But we can check columns of `courses` and `profiles` via REST.
async function checkColumns() {
  const tables = [
    'courses', 'profiles', 'assignments', 'assignment_submissions',
    'modules', 'resources', 'student_progress', 'quizzes', 'questions',
    'question_options', 'quiz_attempts', 'quiz_answers', 'notifications',
    'messages', 'library_resources', 'user_xp', 'xp_logs', 'achievements',
    'user_achievements', 'attendance_summary', 'attendance_records', 'attendance_sessions'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error: ${error.message}`);
    } else {
      console.log(`Table ${table} exists.`);
    }
  }
}

checkColumns();
