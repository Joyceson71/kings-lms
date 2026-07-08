import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type AnyUser =
  | { source: 'supabase'; id: string; email: string }
  | { source: 'local'; id: string; email: string };

/**
 * Returns a Supabase user if one exists, otherwise falls back to the
 * local-auth cookie. Returns null if neither is present.
 */
export async function getUserOrLocal(): Promise<AnyUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return { source: 'supabase', id: user.id, email: user.email ?? '' };
  }

  const cookieStore = await cookies();
  const localAuth = cookieStore.get('kings_lms_auth');
  if (localAuth?.value === 'true') {
    // Return a placeholder — the client-side useUser() hook will populate
    // real profile data from localStorage on hydration.
    return { source: 'local', id: 'local-user', email: '' };
  }

  return null;
}
