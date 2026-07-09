import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Root page: server-side redirect based on auth state.
// No client JS race conditions — the middleware + server component handles everything.
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
