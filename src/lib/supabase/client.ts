'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkusqelpzpaocnwaawkw.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXNxZWxwenBhb2Nud2Fhd2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDcxMDEsImV4cCI6MjA5Nzk4MzEwMX0.kre4tGOz_HO15y1as4Qm8p4c19GlSeOlAFGlANZa7KI';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
