import { createClient } from '@/lib/supabase/server';

/**
 * Fetches the authenticated user's role from the profiles table.
 * Returns 'student' as default if no profile is found.
 */
export async function getRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<'student' | 'faculty' | 'admin'> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const role = data?.role as 'student' | 'faculty' | 'admin' | undefined;
  return role ?? 'student';
}
