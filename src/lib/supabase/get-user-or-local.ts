import { createClient } from '@/lib/supabase/server';

export type AnyUser = { source: 'supabase'; id: string; email: string };

/**
 * Returns the authenticated Supabase user, or null if unauthenticated.
 * The local-auth cookie fallback has been removed — Supabase is the
 * single source of truth.
 */
export async function getUserOrLocal(): Promise<AnyUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return { source: 'supabase', id: user.id, email: user.email ?? '' };
  }
  return null;
}
