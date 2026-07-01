'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  email: '',
  full_name: null,
  role: 'student',
  avatar_url: null,
};

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // Try to fetch profile from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (mounted) {
          if (profileError || !profileData) {
            // Profile not found — use auth metadata as fallback
            setProfile({
              id: user.id,
              email: user.email ?? '',
              full_name:
                (user.user_metadata?.full_name as string) ??
                user.email?.split('@')[0] ??
                'User',
              role: 'student',
              avatar_url: null,
            });
          } else {
            setProfile({
              id: profileData.id,
              email: user.email ?? '',
              full_name: profileData.full_name ?? user.email?.split('@')[0] ?? 'User',
              role: (profileData.role as UserRole) ?? 'student',
              avatar_url: profileData.avatar_url ?? null,
            });
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setProfile({ ...DEFAULT_PROFILE });
          setLoading(false);
        }
      }
    }

    fetchUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
