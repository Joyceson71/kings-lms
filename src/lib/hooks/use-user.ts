'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, type LocalUser, type UserRole } from '@/lib/auth';

export type { UserRole };

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

import { createClient } from '@/lib/supabase/client';

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      // 1. Check Supabase Auth (for Google/Real Users)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch role from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || null,
          role: profileData?.role || 'student', // Default to student if not found
          avatar_url: profileData?.avatar_url || session.user.user_metadata?.avatar_url || null,
        });
        setLoading(false);
        return;
      }

      // 2. Fallback to Local Demo Auth
      const user: LocalUser | null = getCurrentUser();
      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    loadUser();

    // Re-sync when storage changes (multi-tab)
    const handler = () => loadUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return {
    profile,
    loading,
    displayName,
    initials,
    role: profile?.role ?? 'student',
    isAdmin: profile?.role === 'admin',
    isFaculty: profile?.role === 'faculty' || profile?.role === 'admin',
    isStudent: profile?.role === 'student',
  };
}
