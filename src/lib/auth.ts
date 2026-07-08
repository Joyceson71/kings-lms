/**
 * auth.ts — legacy local-auth removed.
 * All authentication now goes through Supabase (supabase.auth.signInWithPassword /
 * supabase.auth.signUp). This file is kept only to export the shared type
 * definitions still referenced in the codebase.
 *
 * @see src/lib/hooks/use-user.ts for the client-side auth hook
 * @see src/app/(auth)/login/page.tsx for sign-in logic
 * @see src/app/(auth)/signup/page.tsx for sign-up logic
 */

export type UserRole = 'student' | 'faculty' | 'admin';

export interface LocalUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
}
